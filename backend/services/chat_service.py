"""
Chat Service — Groq-powered AI chat pipeline with full RAG.

Pipeline per request:
  1. Retrieve semantically relevant products via RAG (not the whole catalogue)
  2. Build a focused system prompt with only those products
  3. Inject conversation history so The Clerk remembers context
  4. Try primary Groq client (gsk_ key, best models) first
  5. Fall back to secondary Groq client (xai- key) if primary fails
  6. Handle tool calls (weather lookup) transparently
  7. Parse [ACTION:...] tags and strip them from the visible text
"""

import re
import json
import httpx
from typing import List
from groq import Groq

from core.config import (
    GROQ_KEYS,
    GROQ_MODELS_PRIMARY,
    GROQ_MODELS_SECONDARY,
    ZEN_API_KEY,
    DEEPSEEK_API_KEY,
    ZEN_MODELS,
    DEEPSEEK_MODELS,
)
from models.schemas import ChatMessage
from services.rag_service import retrieve, is_ready, init_catalog, get_product_by_id

# ── Groq clients (singletons) ─────────────────────────────────────────────────
_groq_clients = [Groq(api_key=key) for key in GROQ_KEYS]


# ── Weather tool ──────────────────────────────────────────────────────────────

_CITY_COORDS = {
    "lahore":     {"lat": 31.5497, "long": 74.3436},
    "karachi":    {"lat": 24.8607, "long": 67.0011},
    "islamabad":  {"lat": 33.6844, "long": 73.0479},
    "peshawar":   {"lat": 34.0151, "long": 71.5249},
    "multan":     {"lat": 30.1575, "long": 71.5249},
    "murree":     {"lat": 33.9078, "long": 73.3906},
    "faisalabad": {"lat": 31.4187, "long": 73.0791},
    "rawalpindi": {"lat": 33.5651, "long": 73.0169},
    "quetta":     {"lat": 30.1798, "long": 66.9750},
}


def get_real_weather(city: str) -> str:
    city = city.lower().strip()
    if city not in _CITY_COORDS:
        return f"Assume the weather in {city} is mild (25°C, pleasant)."
    loc = _CITY_COORDS[city]
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={loc['lat']}&longitude={loc['long']}"
            f"&current=temperature_2m,relative_humidity_2m"
        )
        temp: float = httpx.get(url, timeout=5.0).json()["current"]["temperature_2m"]
        if temp < 10:
            condition, season = "Very Cold — Heavy Winter Gear Needed", "Winter"
        elif temp < 20:
            condition, season = "Cool/Cold — Winter Clothing Recommended", "Winter"
        elif temp < 30:
            condition, season = "Pleasant/Mild — Light Layers Work", "Summer"
        else:
            condition, season = "Hot — Lightweight Summer Clothing Essential", "Summer"
        return (
            f"LIVE Weather in {city.title()}: {temp}°C ({condition}). "
            f"Recommended season: {season}."
        )
    except Exception:
        return f"Could not fetch weather for {city}. Assume pleasant weather (25°C)."


_GROQ_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_real_weather",
            "description": (
                "Gets the REAL current temperature for a Pakistani city. "
                "Call this ONLY when the user explicitly mentions a city or asks "
                "what to wear based on weather."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "City name, e.g. lahore, karachi, islamabad, murree",
                    }
                },
                "required": ["city"],
            },
        },
    }
]


# ── System prompt ─────────────────────────────────────────────────────────────

def _build_system_prompt(inventory_text: str, user_name: str | None = None, current_path: str | None = None, has_store: bool = False, is_authenticated: bool = False, store_collections: list[str] | None = None, product_context_str: str = "") -> str:
    greeting_note = ""
    if user_name:
        greeting_note = f"\nThe customer's name is {user_name}. Address them warmly by name when natural.\n"

    context_note = ""
    if current_path and current_path.startswith("/collections/"):
        try:
            prod_id = current_path.split("/")[-1]
            if prod_id.isdigit():
                context_note = f"\n[SYSTEM CONTEXT]: The user is currently viewing the page for Product ID: {prod_id}. If they say 'this product' or ask questions about it, DO NOT emit SHOW_RESULTS. Just answer their questions directly in the chat. Only emit SHOW_RESULTS if they explicitly ask to see *other* products.\n"
        except:
            pass
            
    if current_path and "/seller/products/edit/" in current_path:
        try:
            prod_id = current_path.split("/")[-1]
            if prod_id.isdigit():
                context_note = f"\n[SYSTEM CONTEXT]: The user is currently EDITING Product ID: {prod_id}.{product_context_str} If they ask you to update details (like name, description, category, etc) based on an image they uploaded or their prompt, emit [ACTION:UPDATE_PRODUCT_EDIT:json_string]. The json_string should be a valid minified JSON object containing the keys to update. For example, [ACTION:UPDATE_PRODUCT_EDIT:{{\"description\":\"New description\",\"detailed_description\":\"Longer description...\"}}]. Make sure to ONLY output the action block without code blocks for the JSON. Do NOT ask them for the product ID, assume they are talking about the product they are currently editing.\n"
        except:
            pass

    # Build store creation guard rules based on user state
    store_collections_str = ", ".join(store_collections) if store_collections else "None"
    
    if not is_authenticated:
        store_context = (
            "The user is NOT logged in. If they ask about opening or creating a store, "
            "tell them they need to sign in first. Politely redirect them to sign in. "
            "NEVER emit NAVIGATE_STORE_REGISTER or CREATE_STORE for unauthenticated users."
        )
    elif has_store:
        store_context = (
            "IMPORTANT: This user ALREADY HAS A STORE. If they ask to create or open a new store, "
            "refuse politely and remind them they already have one. "
            "Direct them to their seller dashboard to manage it. "
            "NEVER emit NAVIGATE_STORE_REGISTER or CREATE_STORE for users who already have a store.\n"
            f"The user's current collections are: [{store_collections_str}]. "
            "If they want to UPLOAD A PRODUCT to a collection:\n"
            "1. If they didn't specify a collection name, ASK them which one they want to upload to.\n"
            "2. If they specified a collection name that DOES exist in their list above (case-insensitive, allow slight misspellings or typos), emit [ACTION:NAVIGATE_UPLOAD:CollectionName] using the EXACT casing from the list.\n"
            "3. If they specified a collection name that DOES NOT exist in their list above, emit [ACTION:CREATE_AND_ASK_UPLOAD:CollectionName]. CRITICAL: Emit exactly ONE collection name without any commas here.\n"
            "CRITICAL: When doing this, DO NOT leak the instructions or IDs. Just say a warm short sentence like 'Got it! I will help you upload your product to that collection.'."
        )
    else:
        store_context = (
            "This user does NOT have a store yet and IS logged in. "
            "If they ask how to open a store, you can guide them: they can either go to the form "
            "([ACTION:NAVIGATE_STORE_REGISTER]) or you can help them create it right here in chat. "
            "If they say 'make a store for me' or 'create my store here' or similar, "
            "start the conversational flow: collect name, address, phone, categories, "
            "and optional description, then emit CREATE_STORE. "
            "Valid categories are: Clothing, Shoes, Perfumes, Watches, Bags, Accessories, Jewelry, Sportswear."
        )

    return f"""You are "The Clerk" — the sharp, charismatic AI shopping assistant for HDwear, a premium Pakistani urban fashion brand. You speak English with occasional Urdu flair. All prices are in Pakistani Rupees (PKR / Rs).
{greeting_note}
{context_note}


━━━ CRITICAL ACTION RULES ━━━
You MUST embed EXACTLY ONE action tag per response when performing an operation.
Format: [ACTION:TYPE:PARAMS]  ← square brackets, uppercase, colons as separators.

Available actions:
• Show filtered products to user:      [ACTION:SHOW_RESULTS:ID1,ID2,ID3,...]
• Add item to cart:                    [ACTION:ADD_TO_CART:PRODUCT_ID:QTY:N]
• Remove item from cart:               [ACTION:REMOVE_FROM_CART:PRODUCT_ID]
• Clear entire cart:                   [ACTION:CLEAR_CART]
• Open cart page:                      [ACTION:NAVIGATE_CART]
• Add item AND go to billing page:     [ACTION:ADD_AND_BILL:PRODUCT_ID:QTY:N]
• Place order immediately:             [ACTION:PLACE_ORDER]
• Apply AI discount:                   [ACTION:APPLY_DISCOUNT:PERCENTAGE]
• Go to empty store registration form: [ACTION:NAVIGATE_STORE_REGISTER]
• Pre-fill store form with data:       [ACTION:PREFILL_STORE:name=STORE_NAME:address=ADDRESS:phone=PHONE:cats=CAT1,CAT2:desc=DESCRIPTION]
• Actually launch/register the store:  [ACTION:CREATE_STORE:name=STORE_NAME:address=ADDRESS:phone=PHONE:cats=CAT1,CAT2:desc=DESCRIPTION]
• Go to Seller Dashboard:              [ACTION:NAVIGATE_SELLER_DASHBOARD]
• Create new collections:              [ACTION:CREATE_COLLECTIONS:Collection1,Collection2]
• Navigate to product upload:          [ACTION:NAVIGATE_UPLOAD:CollectionName]
• Create collection & ask to upload:   [ACTION:CREATE_AND_ASK_UPLOAD:CollectionName]

CRITICAL: When using these tags, you MUST replace all placeholders with actual values. NEVER write literal placeholder text like "PRODUCT_ID", "STORE_NAME", "ADDRESS" etc.
For PREFILL_STORE and CREATE_STORE, do NOT use colons inside field values. Example: [ACTION:PREFILL_STORE:name=Urban Threads:address=Gulberg Lahore:phone=0300-1234567:cats=Clothing,Shoes:desc=Premium urban fashion store]

━━━ STORE CREATION RULES ━━━
{store_context}

━━━ BEHAVIOUR GUIDE ━━━

1. PRODUCT BROWSING:
   User asks to see items → scan the inventory below (already filtered for their request) → emit SHOW_RESULTS with ALL matching IDs from the inventory.
   Be generous: if user says "show summer clothes", include ALL summer clothes listed below.
   For price filters (e.g. "under 5000"), only use IDs from the inventory — it is already price-filtered.
   DO NOT emit SHOW_RESULTS if the user is just asking a question about a product they are already looking at.
   Always write a short, warm 1-2 sentence intro. Do NOT describe or list every product in the text. Rely solely on the SHOW_RESULTS action to update the UI.

2. ADDING TO CART:
   "Add [item] to cart" / "add this" / "add the current item" → use conversation context to identify the product → emit ADD_TO_CART.
   Confirm enthusiastically: "Done! I've added the [name] to your bag."

3. DIRECT CHECKOUT:
   "I want to buy [item]" / "take me to checkout" / "buy this now" / "I wanna buy this" →
   emit ADD_AND_BILL with the product ID. This adds the item AND opens the billing/checkout screen.
   The customer still presses "Confirm Order" themselves — you do NOT emit PLACE_ORDER unless they explicitly say to confirm the order now.
   Say: "Heading to checkout with [item]!"

4. WEATHER OUTFITS:
   User mentions a city → call get_real_weather → recommend season-appropriate items → SHOW_RESULTS.

5. PRICE NEGOTIATION:
   Valid reason (student, birthday, loyal customer, bulk) → give discount via APPLY_DISCOUNT.
   NEVER go below min_price. Be playful about it.

6. PRODUCT RECOMMENDATIONS FORMAT:
   ### [Product Name]
   ![img]([image_url])
   **Price:** Rs [price] | **Rating:** ⭐[rating] | **Color:** [color]
   *[one punchy sentence about why this fits their vibe]*
   [👉 View Details](/collections/[id])

7. STORE CREATION FLOW (TWO-PHASE — VERY IMPORTANT):
   Phase 1 — COLLECT & PRE-FILL:
   If the user wants to create a store (and rules allow), extract the required info from their message.
   You do NOT need to ask one question at a time — if the user provides all info in one message, extract it all at once.
   Required info: store name, address, phone number, at least one category.
   Optional: description. If not provided, write a short professional description yourself based on categories and location.
   Valid categories (map what user says to these exact strings): Clothing, Shoes, Perfumes, Watches, Bags, Accessories, Jewelry, Sportswear.

   CRITICAL RULE: Once you have name + address + phone + at least one category, emit [ACTION:PREFILL_STORE:...] IMMEDIATELY.
   DO NOT repeat or list the store info back in text. DO NOT confirm the details in text.
   Your ONLY text response after emitting [ACTION:PREFILL_STORE:...] should be ONE short sentence:
   e.g. "Your store details are ready — take a look and say **launch** whenever you're set! 🚀"

   Phase 2 — CONFIRM & LAUNCH:
   When the user says "launch", "yes", "confirm", "looks good", "do it" or similar AFTER a PREFILL_STORE was recently emitted,
   emit [ACTION:CREATE_STORE:...] with the SAME data you used in PREFILL_STORE.
   Text response: "🚀 [Store Name] is LIVE! Welcome to the HDwear seller family!"

   FORBIDDEN: Never summarize, list, or echo back the store info in text. The [ACTION:PREFILL_STORE:...] action handles all that visually.

8. SELLER STORE MANAGEMENT:
   If the user already has a store and asks to "take me to my store" or "go to my dashboard", emit [ACTION:NAVIGATE_SELLER_DASHBOARD].
   If the user asks to create collections/folders for their store (e.g., "make collections for shoes and men's clothes"), extract the names and emit [ACTION:CREATE_COLLECTIONS:Shoes,Men's Clothes].
   DO NOT apologize or say "I'm doing it". Just emit the action and say a short confirmation like "Done! Your collections are ready. 🚀".

9. STRICT DOMAIN GUARDRAILS:
   You are strictly an HDwear shopping assistant. You MUST NOT answer questions about coding, cooking, politics, general knowledge, or any topic unrelated to HDwear products, fashion, or the store creation flow.

━━━ RELEVANT INVENTORY (RAG-retrieved for this query) ━━━
{inventory_text}
"""


# ── Inventory context from RAG ────────────────────────────────────────────────

async def _build_inventory_text(query: str, current_path: str | None = None) -> str:
    products = await retrieve(query)
    
    # Force include the current product context if on a product page
    context_prod_id = None
    if current_path and current_path.startswith("/collections/"):
        try:
            prod_id = current_path.split("/")[-1]
            if prod_id.isdigit():
                context_prod_id = int(prod_id)
        except:
            pass

    if context_prod_id and not any(p.id == context_prod_id for p in products):
        context_product = get_product_by_id(context_prod_id)
        if context_product:
            products.insert(0, context_product)

    if not products:
        return "(No products retrieved)"

    lines: List[str] = []
    for p in products:
        desc = p.detailed_description if p.detailed_description else p.description
        short_desc = (desc[:180] + "...") if desc and len(desc) > 180 else (desc or "")
        store_name = ""
        if hasattr(p, "store") and p.store:
            store_name = f" | Store: {p.store.name}"
        sale_info = ""
        if p.is_on_sale:
            sale_info = f" | 🔥 ON SALE {p.sale_percentage}% OFF"
        extra = ""
        if p.material:
            extra += f" | Material: {p.material}"
        if p.style:
            extra += f" | Style: {p.style}"
        if p.occasion:
            extra += f" | Occasion: {p.occasion}"
        negotiable = "Negotiable" if p.is_negotiable else "Fixed Price"
        lines.append(
            f"ID:{p.id} | {p.name} | {p.category} | {p.sub_category} | "
            f"{p.gender} | {p.season} | {p.color} | "
            f"Rs {p.price} (min Rs {p.min_price}) [{negotiable}] | "
            f"Rating:{p.rating} | Stock:{p.stock} | img:{p.image_url}"
            f"{store_name}{sale_info}{extra}\n"
            f"  Desc: {short_desc}"
        )
    return "\n---\n".join(lines)


# ── Groq call with tool handling ──────────────────────────────────────────────

def _call_groq(client: Groq, model: str, messages: list) -> str:
    """Single Groq call with tool-call handling. Returns final text."""
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        tools=_GROQ_TOOLS,
        tool_choice="auto",
        max_tokens=1024,
        temperature=0.7,
    )
    msg = response.choices[0].message
    if not msg.tool_calls:
        return msg.content or ""

    # Execute tool calls and get a second response
    messages = messages + [msg]
    for tc in msg.tool_calls:
        fn_name = tc.function.name
        fn_args = json.loads(tc.function.arguments)
        if fn_name == "get_real_weather":
            result = get_real_weather(fn_args.get("city", ""))
        else:
            result = "Unknown tool."
        messages.append({
            "tool_call_id": tc.id,
            "role": "tool",
            "name": fn_name,
            "content": result,
        })

    second = client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=1024,
        temperature=0.7,
    )
    return second.choices[0].message.content or ""


# ── Helper for OpenAI compatible endpoints (DeepSeek, Zen) ────────────────────
def _call_openai_compatible(api_key: str, base_url: str, model: str, messages: list) -> str:
    """Calls an OpenAI-compatible API endpoint via httpx."""
    # We strip out any tool calls from messages since simple fallbacks might not support them well
    clean_messages = []
    for m in messages:
        if m.get("role") in ["system", "user", "assistant"] and m.get("content"):
            clean_messages.append({"role": m["role"], "content": m["content"]})
            
    response = httpx.post(
        base_url,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": model, "messages": clean_messages, "temperature": 0.7, "max_tokens": 1024},
        timeout=15.0
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"] or ""


# ── Main entry point ──────────────────────────────────────────────────────────

async def run_chat(
    user_message: str,
    history: List[ChatMessage] | None = None,
    user_name: str | None = None,
    current_path: str | None = None,
    has_store: bool = False,
    is_authenticated: bool = False,
    store_collections: List[str] | None = None,
    image_data: List[str] | None = None,
) -> dict:
    """
    Full RAG chat pipeline.

    Args:
        user_message:  Latest user text.
        history:       Previous turns as [ChatMessage(role, content), ...].
                       Kept to last 6 pairs (12 messages) to control token usage.

    Returns:
        dict with keys: text, action, debug_model
    """
    if not is_ready():
        await init_catalog()
    if not is_ready():
        return {
            "text": "I'm still loading the product catalogue — please try again in a moment!",
            "action": "NONE",
            "debug_model": "System",
        }

    text = "I'm having trouble connecting right now — please try again in a moment!"
    ui_action = "NONE"
    used_model = "None"

    try:
        # ── 0. Image processing via Gemini Vision ─────────────────────────────
        if image_data:
            from core.config import GEMINI_API_KEY
            if not GEMINI_API_KEY:
                raise ValueError("Gemini API key not configured for vision.")
            
            # Since image_data is now a list, we iterate over it
            image_parts = []
            for img in image_data:
                if "," in img:
                    mime_part, b64_data = img.split(",", 1)
                    mime_type = mime_part.split(":")[1].split(";")[0]
                else:
                    mime_type = "image/jpeg"
                    b64_data = img
                image_parts.append({
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": b64_data
                    }
                })

            prompt = (
                "You are an expert AI fashion and product assistant. The user wants to upload this product to their store.\n"
                "Analyze the images and return a JSON object with the following fields (leave them empty string if unsure). "
                "Do NOT include the price, leave it to the user.\n"
                "Fields: name, description (catchy short phrase), detailed_description (at least 20 words), "
                "category (Clothing, Shoes, Perfumes, Watches, Bags, Accessories, Jewelry, Sportswear), "
                "sub_category, gender (Men, Women, Unisex), season (Summer, Winter, All Season), color, material, style, occasion.\n"
                "Return ONLY valid JSON and no other text."
            )

            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        *image_parts
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.3,
                    "responseMimeType": "application/json"
                }
            }

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
            resp = httpx.post(url, json=payload, timeout=60.0)
            resp.raise_for_status()
            
            ai_content = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            
            # Clean up potential markdown formatting
            clean_content = ai_content.strip()
            
            # Extract JSON using regex in case the model adds extra text
            json_match = re.search(r"\{.*\}", clean_content, re.DOTALL)
            if not json_match:
                raise ValueError(f"Could not extract JSON from model output: {clean_content}")
                
            # Parse the JSON and format it into an action tag
            data = json.loads(json_match.group(0))
            
            # Create URL encoded representation to pass through action
            import urllib.parse
            encoded_data = urllib.parse.quote(json.dumps(data))
            
            return {
                "text": "I've analyzed your product image! Let's get it uploaded to your store.",
                "action": f"PREFILL_PRODUCT_UPLOAD:{encoded_data}",
                "debug_model": "gemini-2.5-flash"
            }

        # Fetch product details if editing
        product_context_str = ""
        if current_path and "/seller/products/edit/" in current_path:
            try:
                prod_id = int(current_path.split("/")[-1])
                from db.client import global_db
                product = await global_db.product.find_unique(where={"id": prod_id}, include={"images": True})
                if product:
                    sizes = product.size_options or "None"
                    color = product.color or "None"
                    material = product.material or "None"
                    style = product.style or "None"
                    occasion = product.occasion or "None"
                    gender = product.gender or "None"
                    season = product.season or "None"
                    
                    image_desc_str = ""
                    if product.images and len(product.images) > 0:
                        image_url = product.images[0].image_url
                        try:
                            import httpx
                            import base64
                            from core.config import GEMINI_API_KEY
                            if GEMINI_API_KEY:
                                async with httpx.AsyncClient() as http_client:
                                    r = await http_client.get(image_url)
                                    r.raise_for_status()
                                    b64 = base64.b64encode(r.content).decode("utf-8")
                                    
                                    payload = {
                                        "contents": [{
                                            "parts": [
                                                {"text": "Briefly describe this product's visual appearance in 2 sentences. Focus on colors, graphics, patterns, and physical style."},
                                                {"inline_data": {"mime_type": "image/jpeg", "data": b64}}
                                            ]
                                        }],
                                        "generationConfig": {"temperature": 0.2}
                                    }
                                    resp = await http_client.post(f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}", json=payload)
                                    if resp.status_code == 200:
                                        image_desc_str = f"\nImage Visual Description: {resp.json()['candidates'][0]['content']['parts'][0]['text']}\n"
                        except Exception as e:
                            print("Failed to get image description:", e)

                    product_context_str = f"\n\nCURRENT PRODUCT BEING EDITED:\nName: {product.name}\nShort Description: {product.description}\nDetailed Description: {product.detailed_description}\nCategory: {product.category}\nSub-category: {product.sub_category}\nColor: {color}\nSizes: {sizes}\nMaterial: {material}\nStyle: {style}\nOccasion: {occasion}\nGender: {gender}\nSeason: {season}\n{image_desc_str}"
            except Exception as e:
                print("Error fetching product context:", e)

        # ── 1. RAG retrieval ─────────────────────────────────────────────────
        inventory_text = await _build_inventory_text(user_message, current_path=current_path)
        system_prompt = _build_system_prompt(inventory_text, user_name=user_name, current_path=current_path, has_store=has_store, is_authenticated=is_authenticated, store_collections=store_collections, product_context_str=product_context_str)

        # ── 2. Build message list with conversation history ──────────────────
        messages = [{"role": "system", "content": system_prompt}]

        # Inject last 6 turns of history for context
        if history:
            for turn in history[-12:]:   # 12 messages = 6 user + 6 assistant turns
                messages.append({"role": turn.role, "content": turn.content})

        messages.append({"role": "user", "content": user_message})

        success = False
        
        # ── 3. Try Groq clients ───────────────────────────────────────────────
        for idx, client in enumerate(_groq_clients):
            if success:
                break
            for model in GROQ_MODELS_PRIMARY:
                try:
                    print(f"[GROQ-{idx}] Trying {model}...")
                    text = _call_groq(client, model, messages)
                    used_model = f"groq-{idx}/{model}"
                    success = True
                    print(f"[GROQ-{idx}] Success: {model}")
                    break
                except Exception as e:
                    print(f"[GROQ-{idx}] Failed {model}: {e}")

        # ── 4. Fall back to DeepSeek ─────────────────────────────────────────
        if not success and DEEPSEEK_API_KEY:
            for model in DEEPSEEK_MODELS:
                try:
                    print(f"[DEEPSEEK] Trying {model}...")
                    text = _call_openai_compatible(
                        api_key=DEEPSEEK_API_KEY, 
                        base_url="https://api.deepseek.com/chat/completions",
                        model=model, 
                        messages=messages
                    )
                    used_model = f"deepseek/{model}"
                    success = True
                    print(f"[DEEPSEEK] Success: {model}")
                    break
                except Exception as e:
                    print(f"[DEEPSEEK] Failed {model}: {e}")

        # ── 5. Fall back to Zen AI ───────────────────────────────────────────
        if not success and ZEN_API_KEY:
            for model in ZEN_MODELS:
                try:
                    print(f"[ZEN] Trying {model}...")
                    text = _call_openai_compatible(
                        api_key=ZEN_API_KEY, 
                        base_url="https://api.zen.ai/v1/chat/completions",
                        model=model, 
                        messages=messages
                    )
                    used_model = f"zen/{model}"
                    success = True
                    print(f"[ZEN] Success: {model}")
                    break
                except Exception as e:
                    print(f"[ZEN] Failed {model}: {e}")

        if not success:
            print("[CHAT] All attempts failed.")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[CHAT] System error: {e}")

    # ── 5. Parse and strip [ACTION:...] tag ──────────────────────────────────
    if text and re.search(r"action:", text, re.IGNORECASE):
        # Broad match: capture everything between [ACTION: and ] (or end of string or XML tag)
        match = re.search(r"\[?ACTION:([^\]<]+)", text, re.IGNORECASE)
        if match:
            ui_action = match.group(1).strip()
            # Remove the full action tag from visible text (handling optional brackets)
            text = re.sub(r"\[?ACTION:[^\]<]+(?:\])?", "", text, flags=re.IGNORECASE)
            # Remove hallucinated XML tags if any
            text = re.sub(r"</?action>", "", text, flags=re.IGNORECASE).strip()

            # --- FOOLPROOF FALLBACK ---
            # If the AI hallucinated and asked to create an existing collection, override it here.
            if ui_action.startswith("CREATE_AND_ASK_UPLOAD:"):
                coll_name = ui_action.replace("CREATE_AND_ASK_UPLOAD:", "").strip()
                if store_collections:
                    for existing_col in store_collections:
                        if existing_col.lower() == coll_name.lower():
                            ui_action = f"NAVIGATE_UPLOAD:{existing_col}"
                            break

    return {"text": text, "action": ui_action, "debug_model": used_model}

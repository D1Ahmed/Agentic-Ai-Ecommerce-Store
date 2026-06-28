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
    GROQ_API_PRIMARY,
    GROQ_API_SECONDARY,
    GROQ_MODELS_PRIMARY,
    GROQ_MODELS_SECONDARY,
    ZEN_API_KEY,
    DEEPSEEK_API_KEY,
    ZEN_MODELS,
    DEEPSEEK_MODELS,
)
from models.schemas import ChatMessage
from services.rag_service import retrieve, is_ready, init_catalog

# ── Groq clients (singletons) ─────────────────────────────────────────────────
_groq_primary = Groq(api_key=GROQ_API_PRIMARY) if GROQ_API_PRIMARY else None
_groq_secondary = Groq(api_key=GROQ_API_SECONDARY) if GROQ_API_SECONDARY else None


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

def _build_system_prompt(inventory_text: str, user_name: str | None = None) -> str:
    greeting_note = ""
    if user_name:
        greeting_note = f"\nThe customer's name is {user_name}. Address them warmly by name when natural.\n"

    return f"""You are "The Clerk" — the sharp, charismatic AI shopping assistant for HDwear, a premium Pakistani urban fashion brand. You speak English with occasional Urdu flair. All prices are in Pakistani Rupees (PKR / Rs).
{greeting_note}

━━━ CRITICAL ACTION RULES ━━━
You MUST embed EXACTLY ONE action tag per response when performing an operation.
Format: [ACTION:TYPE:PARAMS]  ← square brackets, uppercase, colons as separators.

Available actions:
• Show filtered products to user:   [ACTION:SHOW_RESULTS:ID1,ID2,ID3,...]
• Add item to cart:                  [ACTION:ADD_TO_CART:PRODUCT_ID:QTY:N]
• Remove item from cart:             [ACTION:REMOVE_FROM_CART:PRODUCT_ID]
• Clear entire cart:                 [ACTION:CLEAR_CART]
• Open cart page:                    [ACTION:NAVIGATE_CART]
• Add item AND go to billing page:   [ACTION:ADD_AND_BILL:PRODUCT_ID:QTY:N]
• Place order immediately:           [ACTION:PLACE_ORDER]
• Apply AI discount:                 [ACTION:APPLY_DISCOUNT:PERCENTAGE]

CRITICAL: When using these tags, you MUST replace placeholders like PRODUCT_ID and N with the actual numeric values. For example, if the product's ID is 142 and they want 6 items, you must output exactly [ACTION:ADD_TO_CART:142:QTY:6]. NEVER write the literal strings "PRODUCT_ID", "ID1", or "N" in your output.

━━━ BEHAVIOUR GUIDE ━━━

1. PRODUCT BROWSING:
   User asks to see items → scan the inventory below (already filtered for their request) → emit SHOW_RESULTS with ALL matching IDs from the inventory.
   Be generous: if user says "show summer clothes", include ALL summer clothes listed below.
   For price filters (e.g. "under 5000"), only use IDs from the inventory — it is already price-filtered.
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

━━━ RELEVANT INVENTORY (RAG-retrieved for this query) ━━━
{inventory_text}
"""


# ── Inventory context from RAG ────────────────────────────────────────────────

async def _build_inventory_text(query: str) -> str:
    products = await retrieve(query)
    if not products:
        return "(No products retrieved)"

    lines: List[str] = []
    for p in products:
        desc = p.detailed_description if p.detailed_description else p.description
        short_desc = (desc[:180] + "...") if desc and len(desc) > 180 else (desc or "")
        lines.append(
            f"ID:{p.id} | {p.name} | {p.category} | {p.sub_category} | "
            f"{p.gender} | {p.season} | {p.color} | "
            f"Rs {p.price} (min Rs {p.min_price}) | "
            f"Rating:{p.rating} | Stock:{p.stock} | img:{p.image_url}\n"
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
        # ── 1. RAG retrieval ─────────────────────────────────────────────────
        inventory_text = await _build_inventory_text(user_message)
        system_prompt = _build_system_prompt(inventory_text, user_name=user_name)

        # ── 2. Build message list with conversation history ──────────────────
        messages = [{"role": "system", "content": system_prompt}]

        # Inject last 6 turns of history for context
        if history:
            for turn in history[-12:]:   # 12 messages = 6 user + 6 assistant turns
                messages.append({"role": turn.role, "content": turn.content})

        messages.append({"role": "user", "content": user_message})

        success = False
        
        # ── 3. Try primary Groq client first ─────────────────────────────────
        if _groq_primary:
            for model in GROQ_MODELS_PRIMARY:
                try:
                    print(f"[GROQ-PRIMARY] Trying {model}...")
                    text = _call_groq(_groq_primary, model, messages)
                    used_model = f"primary/{model}"
                    success = True
                    print(f"[GROQ-PRIMARY] Success: {model}")
                    break
                except Exception as e:
                    print(f"[GROQ-PRIMARY] Failed {model}: {e}")

        # ── 4. Fall back to secondary Groq client ────────────────────────────
        if not success and _groq_secondary:
            for model in GROQ_MODELS_SECONDARY:
                try:
                    print(f"[GROQ-SECONDARY] Trying {model}...")
                    text = _call_groq(_groq_secondary, model, messages)
                    used_model = f"secondary/{model}"
                    success = True
                    print(f"[GROQ-SECONDARY] Success: {model}")
                    break
                except Exception as e:
                    print(f"[GROQ-SECONDARY] Failed {model}: {e}")

        # ── 5. Fall back to DeepSeek ─────────────────────────────────────────
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

        # ── 6. Fall back to Zen AI ───────────────────────────────────────────
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
        print(f"[CHAT] System error: {e}")

    # ── 5. Parse and strip [ACTION:...] tag ──────────────────────────────────
    if text and "ACTION:" in text:
        # Allow missing closing bracket in case generation hits max_tokens and truncates
        match = re.search(r"\[ACTION:([a-zA-Z_0-9:,]+)(?:\]|$)", text)
        if match:
            ui_action = match.group(1)
            # Remove the action string from visible text (whether it has a closing bracket or not)
            text = re.sub(r"\[ACTION:[a-zA-Z_0-9:,]+(?:\]|$)", "", text).strip()

    return {"text": text, "action": ui_action, "debug_model": used_model}

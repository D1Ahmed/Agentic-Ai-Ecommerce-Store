# HDwear Project Documentation

> This document outlines the architecture, motivation, and technical implementation of the HDwear AI-powered e-commerce platform. It focuses heavily on the underlying agentic system, retrieval-augmented generation (RAG) pipeline, and backend design decisions.

## 1. Project Background & Motivation

This project started with the aim to explore and learn **RAG (Retrieval-Augmented Generation) systems** and agentic workflows. Initially I started it with my partner as a hackathon project, but due to the lack of understanding about RAG and agentic Ai, since it was a totally new domain for us, we couldnt make much progress and complete it on time for hackathon competition. However, the foundational idea was strong, and i continued development in this summer, making it a fully functional Ai driven Ecommerce Store.

The primary goal was to build a smart, context-aware "clerk" that could seamlessly remove the gap between user intent and database queries using natural language and vision.

## 2. Technical Stack & Backend Architecture

### Why Python/FastAPI instead of Node.js?

While Node.js and nest.js are my primary backend stacks, **Python with FastAPI** was deliberately chosen for the backend due to the heavy reliance on AI and data processing, and for the fact that i wanted to learn Machine Learning, so i had to dive into python, some other reasons:

- **AI/ML Ecosystem:** Python is the native language for modern AI. This project actively utilizes this ecosystem in `rag_service.py`:
  - **`numpy`:** Used for high-performance vector math. It stacks embedding arrays returned from Cohere/Gemini and normalizes them (`np.linalg.norm`) to prepare them for strict cosine similarity comparisons.
  - **`faiss-cpu`:** Meta's library for efficient similarity search. It takes the normalized `numpy` arrays and builds an `IndexFlatIP` (Inner Product) vector database in memory, allowing fast semantic searches across the product catalog without needing a heavy standalone vector DB like Pinecone.
- **Performance:** FastAPI's Pydantic validation makes strict schema adherence (crucial for agent tool caling) with high performance.

### How rag_service.py works?

This service acts as the memory and search engine.

Initialization: On startup, it loads the entire product catalog into memory.
Background Processing: It asynchronously builds the faiss-cpu semantic index in the background without blocking the server.

Hybrid Search: When a user searches, it parses their intent via RegEx (extracting gender, price, category), runs a strict keyword filter, and blends it with a semantic similarity score using the FAISS index and numpy.

## WorkFlow

To truly understand the power of the agentic architecture, here are two step-by-step workflows of how complex requests are handled under the hood:

### Workflow A: "Add this product to the cart"

When a user is viewing a product page (e.g., a Black Hoodie) and types "please add this to my cart", the system executes a precise orchestration:

- Context Injection (Frontend -> Backend): The frontend sends a POST /ai/chat request containing the user's message, but it also silently attaches the current UI state (current_path="/collections/203").
- RAG Override (chat_service.py): The backend detects the user is on a specific product page. It forcefully injects Product ID 203 into the RAG inventory context so the LLM explicitly knows what the word "this" refers to.
- LLM Processing (Groq API): The llama-3.3-70b-versatile model processes the prompt. Following - strict system rules, it recognizes the intent to add the viewed item to the cart.
- Action Tag Emission: Instead of making a direct database call itself, the LLM generates a conversational response paired with a custom UI tag: "Done! I've added the Black Hoodie to your bag. [ACTION:ADD_TO_CART:203:1:1]".
- Tag Parsing & Execution: chat_service.py strips the [ACTION:...] tag from the visible text so the user only sees the friendly message. The raw action tag is sent back to the frontend, where the handleAIAction function queues it (with a 400ms delay for visual smoothness) and triggers the actual PUT /cart/sync API call to update the database.

### Workflow B: AI-Powered Product Upload (Vision)

When a seller wants to upload a new product, they don't need to manually fill out tedious forms. They simply upload an image:

- Image Interception: The frontend converts the image to Base64 and sends it to the /ai/chat endpoint via the image_data payload.
- Groq Bypass (chat_service.py): Because Groq's current models are text-only, the backend immediately detects the image payload and bypasses the standard RAG/Groq pipeline entirely.
- Google Gemini Vision API: The backend routes the image alongside a strict JSON-schema prompt to the Gemini 2.5 Flash API.
- Zero-Input Data Extraction: Gemini acts as a visual expert, analyzing the image to determine the category, material, style, color, occasion, and even drafting a catchy description. It returns this strictly formatted as a JSON object.
- Form Auto-Fill: The backend encodes this JSON and emits a special action tag: [ACTION:PREFILL_PRODUCT_UPLOAD:{...encoded_json...}]. The frontend intercepts this tag and instantly populates the entire product upload form, requiring zero text input from the seller.

### External APIs & Their Purpose

The backend utilizes a, multi-layered API architecture to ensure high availability and intelligence:

1. **Groq API (Primary LLM):** Powers "The Clerk's" conversational brain for fast inference. To solve rate limits problem, the system implements a **multi key rotation and model waterfall strategy**:
   - It maintains a pool of multiple API keys (multiple free Groq Api's `gsk_` which i got by different gmail accounts :D ).
   - For every request, it attempts to use the most capable primary model first (e.g., `llama-3.3-70b-versatile`).
   - If a `429 Rate Limit` is hit, it doesn't fail; it seamlessly shifts to the next API key in the pool, and climbs down to lighter fallback models to ensure the user always gets a response.
2. **DeepSeek / Zen AI (Fallback LLMs):** They were supposed to act as fallback models but for some reason these Apis didnt work for me.
3. **Cohere & Google Gemini (Embeddings):** Used to generate vector embeddings for the product catalog. Cohere is prioritized, falling back to Gemini if rate limited.
4. **Google Gemini Vision API:** Integrated to allow sellers to upload product images. The AI analyzes the image, extracts details (color, style, category), and automatically pre-fills the product upload schema.
5. **Open-Meteo API (Tool Calling):** A weather API used dynamically by the agent. If a user asks "What should I wear in Lahore today?", the agent calls this tool to fetch real time temperatures and recommends appropriate seasonal clothing.

## 3. The Agentic Architecture

The core of the system is a highly orchestrated AI agent designed to interact with the UI.

### "The Clerk" — AI Personality

The AI is defined via a strict system prompt as "The Clerk": charismatic shopping assistant for HDwear, name of my ecom store. If a person is not signed in, it will call them sir, once signed in and it knows your name, it will call u by name. It is strictly context bounded; it refuses to answer non fashion queries.

### Action-Driven UI (Tool Use)

Instead of function calling for UI manipulation, the agent uses a custom **Action Tagging** system. The AI emits tags like `[ACTION:SHOW_RESULTS:ID1,ID2]` or `[ACTION:ADD_TO_CART:ID]`. The backend parses these, removes them from the visible chat, and sends the action to the frontend to make UI state changes (e.g., opening a checkout modal or rendering product cards).

### True Hybrid RAG Pipeline

The retrieval system does not rely only on slow semantic searches. It uses a **Hybrid Search**, (which i had to implement because i was facing problems that agent would sometimes wont recgonize the subcategories, like if i say show me shoes, it often missed showing me boots, sandals, which fall under the category of shoes) :

1. **Intent Parsing (Offline):** Uses RegEx to extract hard filters (gender, season, price limits) directly from the query.
2. **Keyword Scoring (Offline):** Rapidly scores products based on exact keyword matches.
3. **Semantic Scoring (FAISS):** Generates embeddings for the query and compares them against the cached FAISS index of the product catalog.
4. **Score Blending:** Blends the keyword score and semantic score (favoring semantics but allowing strong keyword matches to compete) to return highly accurate, filtered results.

## 4. Relational Database Design (Prisma)

For database i used supabase postgresSql. The schema show multi vendor relational architecture:

- **User & Auth Layer:** The `User` model handles authentication (passwords and Google SSO), role based access (`customer`), and serves as the root for all user interactions (Carts, Orders, Reviews, and Store Ownership).
- **Multi-Vendor Store System:** A User can optionally own a `Store`. Stores can have multiple `Collection`s. This isolated vendor architecture allows the system to easily filter queries by `store_id` and handle store-specific subscriptions and analytics.
- **Comprehensive Product Modeling:** The `Product` entity is rich with e-commerce and fashion-specific attributes (sizes, colors, material, occasion, season) stored efficiently. It supports multiple `ProductImage`s, and has foreign keys mapping it to a `Store` and a `Collection`.
- **Cart & Order Flow:** The checkout process is completely tracked via relational constraints. `UserCartItem` manages the shopping state, while `Order` and `OrderItem` stores the prices and configurations at the time of purchase.
- **Referential Integrity:** The schema extensively uses `onDelete: Cascade` (e.g., deleting a User cleans up their cart, orders, and store) and `onDelete: SetNull` to guarantee data integrity across the database without leaving orphaned records.

## 5. System Evaluation

### Where the Agent Excels

- **Multi-Modal Workflows:** It transitions so well from chatting to analyzing the images, once on product upload page, if i upload images of product, the gemini api activates, reads the image, gives all info to groq, which then populates the whole product form.
- **Fault Tolerance:** The multi tiered fallback system for LLMs and Embeddings ensures the bot rarely "breaks" due to third party API limits.
- **Context Awareness:** It tracks user state (logged in vs. unauthenticated, has store vs. no store, currently viewed product) to guide them through complex flows like Store Registration without overwhelming them.

### Where the Agent Lacks

- **Complex Multi-Constraint Reasoning:** While hybrid search is strong, highly complex negative constraints (e.g., "Show me shirts that are neither red nor blue, and under 5k but not on sale") can sometimes confuse the prompt based intent parser.
- **Index Rebuilding:** Semantic search requires background rebuilding of the FAISS index when the catalog updates, meaning new items might rely only on keyword search for a few minutes.

## 6. Hurdles Faced & Mitigations

**Hurdle:** Severe rate-limiting from free-tier AI APIs during development and testing.
**Mitigation:** Implemented a round-robin key rotation strategy for Groq and cascading fallbacks (Cohere -> Gemini, Groq -> DeepSeek -> Zen AI) to ensure high availability.

**Hurdle:** The LLM hallucinating UI actions or emitting raw XML/Action tags to the user.
**Mitigation:** Developed post-processing regex in `chat_service.py` to strip hallucinatory tags. Added foolproof overrides (e.g., if the AI tries to create an existing collection, the backend intercepts and changes the action to navigate instead).

**Hurdle:** The LLM losing track of the product the user is currently viewing.
**Mitigation:** Injected the current UI path and product context directly into the system prompt at runtime, enforcing rules that prevent the AI from emitting `SHOW_RESULTS` if the user is asking about the currently focused item.

---

## 7. Performance Metrics

Based on recent system profiling and API dashboard logs, the architecture handles the heavy LLM lifting with the following performance characteristics:

- **System Prompt & Token Usage:** The highly detailed agent persona, store state rules, and dynamic RAG inventory inject an average of **4,500 to 5,200 input tokens** per request.
- **LLM Inference Speed (Groq):** Once the request hits Groq, the time-to-first-token is consistently near **0.4 - 0.6 seconds**, with total generation time usually completing in under **1.0 second** for the `llama-3.3-70b-versatile` model.
- **End-to-End Chat Latency:** The full `POST /ai/chat` request—including RAG retrieval, prompt construction, LLM inference, and fallback handling—averages around **3.9 seconds** end-to-end from the frontend perspective.
- **Database / Retrieval Speed:** Standard catalog queries and fast-path retrievals are highly optimized, completing in roughly **35ms**.
- **Action Parsing Reliability:** The custom tag extraction logic is highly reliable. Frontend logs show seamless parsing of complex tags (e.g., `ADD_TO_CART:203:1:1`, `NAVIGATE_SELLER_DASHBOARD`) which are successfully intercepted and executed by the UI handler with a deliberate 400ms queuing delay for visual smoothness.

The Groq API dashboard logs reveal frequent `429 Rate limit exceeded` errors on the free tier. This real-world data perfectly validates the necessity of the multi-key rotation and multi-provider fallback architecture (DeepSeek/Zen AI) implemented in `chat_service.py` to maintain a stable user experience.

Video Demo of project: https://www.linkedin.com/posts/dawoodahmedjavid_softwareengineering-artificialintelligence-ugcPost-7481855638805925888-Q_c_/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAD3MTW8BBEq5KJ4gGeXksLbV9aQNxxrVazI

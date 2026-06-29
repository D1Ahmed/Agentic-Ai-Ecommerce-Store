import os
from dotenv import load_dotenv

load_dotenv()

# ── Gemini (for embeddings) ───────────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# ── Cohere (preferred embedding provider — more reliable free tier) ───────────
COHERE_API_KEY: str = os.getenv("COHERE_API", "")

# ── Groq AI ───────────────────────────────────────────────────────────────────
raw_groq_keys = os.getenv("GROQ_KEYS", "")
if raw_groq_keys:
    GROQ_KEYS = [k.strip() for k in raw_groq_keys.split(",") if k.strip()]
else:
    GROQ_KEYS = []
    if os.getenv("GROQ_API_TWO"):
        GROQ_KEYS.append(os.getenv("GROQ_API_TWO", ""))
    if os.getenv("GROQ_API_KEY"):
        GROQ_KEYS.append(os.getenv("GROQ_API_KEY", ""))

# ── Zen AI & DeepSeek ─────────────────────────────────────────────────────────
ZEN_API_KEY: str = os.getenv("ZEN_API", "")
DEEPSEEK_API_KEY: str = os.getenv("DeepSeek_API", "")

# Models to try on the primary (real Groq) key — most capable first
GROQ_MODELS_PRIMARY = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
]

# Models to try on the secondary key — lighter models as a safety net
GROQ_MODELS_SECONDARY = [
    "llama-3.1-8b-instant",
    "llama-3.2-3b-preview",
]

# Zen AI Models (Assuming OpenAI compatibility or similar)
ZEN_MODELS = [
    "llama-3.3-70b", # Assuming standard llama name for Zen
]

# DeepSeek Models
DEEPSEEK_MODELS = [
    "deepseek-chat",
]

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://hdwear.vercel.app",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    CORS_ORIGINS.append(frontend_url)

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL: str = os.getenv("DATABASE_URL", "")

# ── RAG settings ─────────────────────────────────────────────────────────────
RAG_TOP_K: int = 20          # Default products retrieved per query
EMBED_MODEL: str = "models/gemini-embedding-001"

# ── Auth ──────────────────────────────────────────────────────────────────────
AUTH_SECRET: str = os.getenv("AUTH_SECRET", "hdwear-dev-secret-change-in-production")
SESSION_EXPIRE_DAYS: int = 30

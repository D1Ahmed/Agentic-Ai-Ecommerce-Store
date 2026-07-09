from fastapi import APIRouter
from models.schemas import ChatRequest
from services.chat_service import run_chat

router = APIRouter(prefix="/ai", tags=["AI Chat"])


@router.post("/chat")
async def chat_with_clerk(request: ChatRequest):
    """
    Accepts a user message + optional conversation history.
    Runs through the RAG pipeline and returns the AI response
    along with any UI action to trigger on the frontend.
    """
    return await run_chat(
        user_message=request.user_message,
        history=request.history or [],
        user_name=request.user_name,
        current_path=request.current_path,
        has_store=request.has_store or False,
        is_authenticated=request.is_authenticated or False,
        store_collections=request.store_collections or [],
        image_data=request.image_data,
    )

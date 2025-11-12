from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.chat import ChatRequest, ChatResponse
from app.api.deps import get_current_user
from app.services.rag_service import rag_service

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/", response_model=ChatResponse)
def ask_question(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ask a question about a document using RAG (Retrieval-Augmented Generation).
    
    - **document_id**: ID of the document to query
    - **question**: Your question about the document
    
    The system will:
    1. Retrieve relevant sections from the document
    2. Use AI (Groq) to generate an accurate answer
    3. Return the answer with source references
    """
    # Verify document exists and belongs to user
    document = db.query(Document).filter(
        Document.id == chat_request.document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if document has been processed
    if not document.vector_store_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document has not been processed yet. Please wait for processing to complete."
        )
    
    # Query the document using RAG
    result = rag_service.query_document(
        question=chat_request.question,
        document_id=chat_request.document_id
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["answer"]
        )
    
    return ChatResponse(
        question=chat_request.question,
        answer=result["answer"],
        document_id=chat_request.document_id,
        sources=result.get("sources", [])
    )


@router.get("/document/{document_id}", response_model=dict)
def get_document_info_for_chat(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get document information for chat interface.
    
    - **document_id**: ID of the document
    
    Returns basic document info to display in chat interface.
    """
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return {
        "document_id": document.id,
        "filename": document.original_filename,
        "page_count": document.page_count,
        "uploaded_at": document.uploaded_at,
        "is_processed": bool(document.vector_store_id),
        "ready_for_chat": bool(document.vector_store_id and document.extracted_text)
    }
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime
import os
import uuid
from pathlib import Path

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentListResponse, DocumentUploadResponse
from app.api.deps import get_current_user
from app.services.pdf_processor import extract_text_from_pdf, get_file_size_mb, validate_pdf
from app.services.rag_service import rag_service
from app.config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF document for processing.
    
    - **file**: PDF file to upload (max 10MB)
    
    The document will be:
    1. Validated as a PDF
    2. Saved to the server
    3. Text extracted
    4. Embedded into vector database for RAG
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    try:
        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Validate PDF
        validation = validate_pdf(file_path)
        if not validation["valid"]:
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid PDF file: {validation['error']}"
            )
        
        # Get file size
        file_size = get_file_size_mb(file_path)
        
        # Check file size limit
        if file_size and file_size > (settings.MAX_UPLOAD_SIZE / (1024 * 1024)):
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds limit of {settings.MAX_UPLOAD_SIZE / (1024 * 1024)}MB"
            )
        
        # Extract text from PDF
        extraction_result = extract_text_from_pdf(file_path)
        
        if not extraction_result["success"]:
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to extract text: {extraction_result['error']}"
            )
        
        # Create document record
        new_document = Document(
            user_id=current_user.id,
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=file.content_type or "application/pdf",
            extracted_text=extraction_result["text"],
            page_count=extraction_result["page_count"],
            processed_at=datetime.utcnow()
        )
        
        db.add(new_document)
        db.commit()
        db.refresh(new_document)
        
        # Create vector store for RAG
        success = rag_service.create_vector_store(
            text=extraction_result["text"],
            document_id=new_document.id
        )
        
        if success:
            new_document.vector_store_id = f"doc_{new_document.id}"
            db.commit()
        
        return {
            "message": "Document uploaded and processed successfully",
            "document": DocumentResponse.model_validate(new_document)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing document: {str(e)}"
        )


@router.get("/", response_model=DocumentListResponse)
def list_documents(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of user's uploaded documents.
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    # Query user's documents
    documents = db.query(Document).filter(
        Document.user_id == current_user.id
    ).order_by(Document.uploaded_at.desc()).offset(skip).limit(limit).all()
    
    total = db.query(Document).filter(Document.user_id == current_user.id).count()
    
    return {
        "total": total,
        "documents": [DocumentResponse.model_validate(doc) for doc in documents]
    }


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific document.
    
    - **document_id**: ID of the document
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
    
    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a document and its vector store.
    
    - **document_id**: ID of the document to delete
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
    
    # Delete file from disk
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    # Delete vector store
    rag_service.delete_vector_store(document_id)
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}
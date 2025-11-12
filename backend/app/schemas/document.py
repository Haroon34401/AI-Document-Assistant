from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DocumentResponse(BaseModel):
    """Schema for single document response"""
    id: int
    user_id: int
    filename: str
    original_filename: str
    file_size: Optional[float] = None
    page_count: Optional[int] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "user_id": 1,
                "filename": "doc_123456.pdf",
                "original_filename": "my_document.pdf",
                "file_size": 2.5,
                "page_count": 10,
                "uploaded_at": "2024-01-01T12:00:00",
                "processed_at": "2024-01-01T12:01:00"
            }
        }


class DocumentListResponse(BaseModel):
    """Schema for list of documents response"""
    total: int
    documents: List[DocumentResponse]
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 2,
                "documents": [
                    {
                        "id": 1,
                        "filename": "doc1.pdf",
                        "uploaded_at": "2024-01-01T12:00:00"
                    },
                    {
                        "id": 2,
                        "filename": "doc2.pdf",
                        "uploaded_at": "2024-01-02T12:00:00"
                    }
                ]
            }
        }


class DocumentUploadResponse(BaseModel):
    """Schema for document upload response"""
    message: str
    document: DocumentResponse
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Document uploaded and processed successfully",
                "document": {
                    "id": 1,
                    "filename": "doc_123456.pdf",
                    "uploaded_at": "2024-01-01T12:00:00"
                }
            }
        }
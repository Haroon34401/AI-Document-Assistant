from pydantic import BaseModel, Field
from typing import Optional, List


class ChatRequest(BaseModel):
    """Schema for chat question request"""
    document_id: int = Field(..., description="ID of the document to query")
    question: str = Field(..., min_length=1, max_length=1000, description="Question about the document")
    
    class Config:
        json_schema_extra = {
            "example": {
                "document_id": 1,
                "question": "What is the main topic of this document?"
            }
        }


class ChatResponse(BaseModel):
    """Schema for chat answer response"""
    question: str
    answer: str
    document_id: int
    sources: Optional[List[str]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "What is the main topic of this document?",
                "answer": "The main topic of this document is...",
                "document_id": 1,
                "sources": ["Page 1: Introduction", "Page 3: Overview"]
            }
        }


class ChatHistoryResponse(BaseModel):
    """Schema for chat history"""
    document_id: int
    chat_history: List[dict]
    
    class Config:
        json_schema_extra = {
            "example": {
                "document_id": 1,
                "chat_history": [
                    {
                        "question": "What is this about?",
                        "answer": "This document discusses...",
                        "timestamp": "2024-01-01T12:00:00"
                    }
                ]
            }
        }
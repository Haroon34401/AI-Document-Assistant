from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Document(Base):
    """
    Document model for storing uploaded PDF files and their metadata
    """
    __tablename__ = "documents"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Key
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # File Information
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Float, nullable=True)  # Size in MB
    mime_type = Column(String(100), default="application/pdf")
    
    # Content
    extracted_text = Column(Text, nullable=True)
    page_count = Column(Integer, nullable=True)
    
    # Vector DB Reference
    vector_store_id = Column(String(100), nullable=True)  # ChromaDB collection ID
    
    # Timestamps
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)  # When text extraction completed
    
    # Relationships
    owner = relationship("User", back_populates="documents")
    
    def __repr__(self):
        return f"<Document(id={self.id}, filename='{self.filename}', user_id={self.user_id})>"
    
    def to_dict(self):
        """Convert document object to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_size": self.file_size,
            "page_count": self.page_count,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
        }
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    
    # JWT Settings
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key-change-me")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    
    # Groq API
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = "openai/gpt-oss-120b"
    
    # Application
    APP_NAME = os.getenv("APP_NAME", "AI Document Assistant")
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
    
    # File Upload
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", 10485760))
    ALLOWED_EXTENSIONS = [".pdf"]
    
    # Vector Database
    CHROMA_DB_DIR = os.getenv("CHROMA_DB_DIR", "chroma_db")
    EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
    CHUNK_SIZE = 1000
    CHUNK_OVERLAP = 200
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    
    @classmethod
    def get_cors_origins(cls):
        """Convert comma-separated origins to list"""
        return [origin.strip() for origin in cls.ALLOWED_ORIGINS.split(",")]
    
    @classmethod
    def setup_directories(cls):
        """Create necessary directories if they don't exist"""
        Path(cls.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
        Path(cls.CHROMA_DB_DIR).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directories: {cls.UPLOAD_DIR}, {cls.CHROMA_DB_DIR}")


# Create global settings instance
settings = Settings()

# Setup directories on import
settings.setup_directories()

# # Print confirmation
# if __name__ == "__main__":
#     print("Settings loaded successfully!")
#     print(f"App Name: {settings.APP_NAME}")
#     print(f"Database: {settings.DATABASE_URL}")
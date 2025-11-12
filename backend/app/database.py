from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG  # Log SQL queries in debug mode
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency function to get database session.
    Use this in FastAPI route dependencies.
    
    Example:
        @app.get("/items/")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database - create all tables.
    Call this when starting the application.
    """
    # Import all models here to ensure they're registered with Base
    from app.models import user, document
    
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")


def drop_db():
    """
    Drop all database tables.
    Use with caution! Only for development/testing.
    """
    Base.metadata.drop_all(bind=engine)
    print("⚠️ All database tables dropped!")


def reset_db():
    """
    Reset database - drop and recreate all tables.
    Use with caution! Only for development/testing.
    """
    drop_db()
    init_db()
    print("🔄 Database reset complete!")


if __name__ == "__main__":
    print("Testing database connection...")
    print(f"Database URL: {settings.DATABASE_URL}")
    init_db()
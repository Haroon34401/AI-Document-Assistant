from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from groq import Groq
from app.config import settings
from typing import Dict, List, Optional
import os


class RAGService:
    """
    Retrieval-Augmented Generation Service
    Handles document embedding, vector storage, and AI-powered question answering
    """
    
    def __init__(self):
        """Initialize RAG service with embeddings and Groq client"""
        # Initialize embeddings model
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'}
        )
        
        # Initialize Groq client
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
        
        print("✅ RAG Service initialized")
    
    def create_vector_store(self, text: str, document_id: int) -> bool:
        """
        Create vector store from document text.
        
        Args:
            text: Document text content
            document_id: Unique document identifier
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Split text into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP,
                length_function=len,
            )
            chunks = text_splitter.split_text(text)
            
            print(f"📄 Split document into {len(chunks)} chunks")
            
            # Create vector store directory
            persist_directory = os.path.join(settings.CHROMA_DB_DIR, f"doc_{document_id}")
            
            # Create and persist vector store
            vectorstore = Chroma.from_texts(
                texts=chunks,
                embedding=self.embeddings,
                persist_directory=persist_directory,
                collection_name=f"doc_{document_id}"
            )
            
            print(f"✅ Vector store created for document {document_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error creating vector store: {e}")
            return False
    
    def query_document(self, question: str, document_id: int) -> Dict[str, any]:
        """
        Query a document using RAG.
        
        Args:
            question: User's question
            document_id: Document to query
            
        Returns:
            Dictionary with answer and metadata
        """
        try:
            # Load vector store
            persist_directory = os.path.join(settings.CHROMA_DB_DIR, f"doc_{document_id}")
            
            if not os.path.exists(persist_directory):
                return {
                    "answer": "Document not found or not processed yet.",
                    "success": False,
                    "sources": []
                }
            
            vectorstore = Chroma(
                persist_directory=persist_directory,
                embedding_function=self.embeddings,
                collection_name=f"doc_{document_id}"
            )
            
            # Retrieve relevant chunks
            retriever = vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 3}  # Get top 3 most relevant chunks
            )
            
            # relevant_docs = retriever.get_relevant_documents(question)
            relevant_docs = vectorstore.similarity_search(question, k=3)

            
            # Prepare context from retrieved documents
            context = "\n\n".join([doc.page_content for doc in relevant_docs])
            
            # Create prompt for Groq
            prompt = f"""You are a helpful AI assistant. Answer the question based on the provided context from the document.

Context from document:
{context}

Question: {question}

Instructions:
- Answer based only on the provided context
- If the context doesn't contain enough information, say so
- Be concise and accurate
- Use bullet points if listing multiple items

Answer:"""

            # Query Groq AI
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=settings.GROQ_MODEL,
                temperature=0.3,
                max_tokens=1000,
            )
            
            answer = chat_completion.choices[0].message.content
            
            # Extract source information
            sources = [f"Chunk {i+1}" for i in range(len(relevant_docs))]
            
            return {
                "answer": answer,
                "success": True,
                "sources": sources,
                "context_used": len(relevant_docs)
            }
            
        except Exception as e:
            print(f"❌ Error querying document: {e}")
            return {
                "answer": f"Error processing question: {str(e)}",
                "success": False,
                "sources": []
            }
    
    def delete_vector_store(self, document_id: int) -> bool:
        """
        Delete vector store for a document.
        
        Args:
            document_id: Document identifier
            
        Returns:
            True if successful, False otherwise
        """
        try:
            import shutil
            persist_directory = os.path.join(settings.CHROMA_DB_DIR, f"doc_{document_id}")
            
            if os.path.exists(persist_directory):
                shutil.rmtree(persist_directory)
                print(f"✅ Deleted vector store for document {document_id}")
                return True
            return False
            
        except Exception as e:
            print(f"❌ Error deleting vector store: {e}")
            return False


# Global RAG service instance
rag_service = RAGService()


# # Test the RAG service
# if __name__ == "__main__":
#     print("RAG Service - Ready")
#     print("This service handles document embeddings and AI-powered Q&A")
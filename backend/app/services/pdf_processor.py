import PyPDF2
from pathlib import Path
from typing import Dict, Optional


def extract_text_from_pdf(file_path: str) -> Dict[str, any]:
    """
    Extract text content from a PDF file.
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Dictionary containing:
        - text: Extracted text content
        - page_count: Number of pages
        - success: Boolean indicating success
        - error: Error message if failed
    """
    try:
        # Check if file exists
        if not Path(file_path).exists():
            return {
                "text": "",
                "page_count": 0,
                "success": False,
                "error": "File not found"
            }
        
        # Open and read PDF
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            page_count = len(pdf_reader.pages)
            
            # Extract text from each page
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += f"\n--- Page {page_num + 1} ---\n"
                        text += page_text
                except Exception as e:
                    print(f"Warning: Could not extract text from page {page_num + 1}: {e}")
                    continue
        
        return {
            "text": text.strip(),
            "page_count": page_count,
            "success": True,
            "error": None
        }
        
    except Exception as e:
        return {
            "text": "",
            "page_count": 0,
            "success": False,
            "error": str(e)
        }


def get_file_size_mb(file_path: str) -> Optional[float]:
    """
    Get file size in megabytes.
    
    Args:
        file_path: Path to the file
        
    Returns:
        File size in MB, or None if error
    """
    try:
        file_size_bytes = Path(file_path).stat().st_size
        file_size_mb = file_size_bytes / (1024 * 1024)
        return round(file_size_mb, 2)
    except Exception as e:
        print(f"Error getting file size: {e}")
        return None


def validate_pdf(file_path: str) -> Dict[str, any]:
    """
    Validate if a file is a valid PDF.
    
    Args:
        file_path: Path to the file
        
    Returns:
        Dictionary with validation results
    """
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            page_count = len(pdf_reader.pages)
            
            return {
                "valid": True,
                "page_count": page_count,
                "error": None
            }
    except Exception as e:
        return {
            "valid": False,
            "page_count": 0,
            "error": str(e)
        }


# # Test the PDF processor
# if __name__ == "__main__":
#     print("PDF Processor Service - Ready")
#     print("This service extracts text from PDF files")
#     print("Example usage:")
#     print("  result = extract_text_from_pdf('path/to/file.pdf')")
#     print("  print(result['text'])")
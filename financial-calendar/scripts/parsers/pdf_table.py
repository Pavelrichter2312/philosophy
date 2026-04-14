"""PDF table extraction using pdfplumber."""

import io
from typing import Optional

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False


def extract_tables_from_bytes(pdf_bytes: bytes, page_range: Optional[tuple[int, int]] = None) -> list[list[list[str]]]:
    """Extract all tables from a PDF byte string."""
    if not HAS_PDFPLUMBER:
        raise ImportError("pdfplumber not installed. Run: pip install pdfplumber")

    result = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        pages = pdf.pages
        if page_range:
            pages = pages[page_range[0]:page_range[1]]
        for page in pages:
            for table in page.extract_tables():
                cleaned = []
                for row in table:
                    cells = [str(cell).strip() if cell else "" for cell in row]
                    if any(cells):
                        cleaned.append(cells)
                if cleaned:
                    result.append(cleaned)
    return result


def find_page_with_keyword(pdf_bytes: bytes, keyword: str) -> Optional[int]:
    """Return page index (0-based) of first page containing keyword."""
    if not HAS_PDFPLUMBER:
        raise ImportError("pdfplumber not installed")

    keyword_lower = keyword.lower()
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            if keyword_lower in text.lower():
                return i
    return None

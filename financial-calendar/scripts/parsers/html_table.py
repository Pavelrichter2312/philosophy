"""HTML table extraction utilities using BeautifulSoup."""

from typing import Optional
from bs4 import BeautifulSoup, Tag


def extract_tables(html: str) -> list[list[list[str]]]:
    """Extract all tables from HTML as list of (rows of cells)."""
    soup = BeautifulSoup(html, "lxml")
    result = []
    for table in soup.find_all("table"):
        rows = []
        for tr in table.find_all("tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
            if cells:
                rows.append(cells)
        if rows:
            result.append(rows)
    return result


def find_table_by_header(html: str, header_keyword: str) -> Optional[list[list[str]]]:
    """Find the first table whose header row contains keyword (case-insensitive)."""
    for table in extract_tables(html):
        if any(header_keyword.lower() in cell.lower() for cell in (table[0] if table else [])):
            return table
    return None


def table_to_dict(rows: list[list[str]], key_col: int = 0, value_col: int = 1) -> dict[str, str]:
    """Convert a 2-column table to a key-value dict."""
    return {row[key_col]: row[value_col] for row in rows if len(row) > value_col}


def parse_number(text: str) -> Optional[float]:
    """Parse a financial number string to float (handles commas, parentheses for negatives)."""
    if not text or text in ("—", "-", "N/A", ""):
        return None
    text = text.replace(",", "").replace(" ", "").replace("\xa0", "")
    negative = text.startswith("(") and text.endswith(")")
    text = text.strip("()")
    try:
        value = float(text)
        return -value if negative else value
    except ValueError:
        return None

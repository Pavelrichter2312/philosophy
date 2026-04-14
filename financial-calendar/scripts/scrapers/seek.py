"""
SEEK Limited scraper — ASX announcements + PDF annual reports.

Strategy:
1. Fetch ASX announcements for SEK via the ASX API
2. Filter for "full year results" and "half year results" PDFs
3. Parse income statement tables from the PDF using pdfplumber
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from scripts.base_scraper import BaseScraper
from scripts.parsers.pdf_table import extract_tables_from_bytes, find_page_with_keyword
from scripts.parsers.normalizer import normalize_income_statement

DATA_ROOT = Path(__file__).parent.parent.parent / "data"

ASX_ANNOUNCEMENTS_URL = (
    "https://www.asx.com.au/asx/1/company/SEK/announcements"
    "?count=20&market_sensitive=false"
)


class SeekScraper(BaseScraper):
    RATE_LIMIT_SECS = 3.0  # Be polite to ASX

    def scrape_earnings_calendar(self) -> list[dict]:
        """Scrape upcoming/recent earnings events from ASX announcements."""
        html = self.fetch_html(ASX_ANNOUNCEMENTS_URL)
        try:
            data = json.loads(html)
            announcements = data.get("data", [])
        except Exception:
            return []

        events = []
        for ann in announcements:
            title = ann.get("header", "").lower()
            if any(kw in title for kw in ["full year", "half year", "annual results", "half year results"]):
                period = "FY" if "full year" in title or "annual" in title else "H1"
                date = ann.get("document_date", "")[:10]
                fy = date[:4]
                events.append({
                    "id": f"seek-{period.lower()}{fy}",
                    "companySlug": "seek",
                    "companyName": "SEEK Limited",
                    "ticker": "SEK",
                    "exchange": "ASX",
                    "periodLabel": f"{period} FY{fy}",
                    "announcedDate": date,
                    "status": "reported",
                    "reportUrl": ann.get("url", ""),
                })
        return sorted(events, key=lambda e: e["announcedDate"])

    def scrape_financials(self, fiscal_year: int) -> dict:
        """
        Attempt to find and parse SEEK annual report PDF.
        Falls back gracefully if PDF parsing is not available.
        """
        print(f"SEEK FY{fiscal_year}: Attempting to fetch annual report PDF from ASX...")

        # The SEEK annual report PDF is typically linked from ir.seek.com.au
        # For now we log the approach — actual URL needs to be discovered each year
        ir_url = "https://ir.seek.com.au/investor-centre/results-and-presentations"
        html = self.fetch_html(ir_url)

        # Look for PDF links in the IR page
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")
        pdf_links = [
            a["href"] for a in soup.find_all("a", href=True)
            if a["href"].endswith(".pdf") and str(fiscal_year) in a.get_text()
        ]

        if not pdf_links:
            print(f"  No PDF found for FY{fiscal_year}. Using existing seed data.")
            return {}

        pdf_url = pdf_links[0]
        if not pdf_url.startswith("http"):
            pdf_url = "https://ir.seek.com.au" + pdf_url

        pdf_bytes = self.fetch_pdf_bytes(pdf_url)
        page_idx = find_page_with_keyword(pdf_bytes, "Income Statement")
        if page_idx is None:
            page_idx = find_page_with_keyword(pdf_bytes, "Revenue")

        tables = extract_tables_from_bytes(pdf_bytes, (page_idx, page_idx + 5) if page_idx else None)

        raw_is = {}
        for table in tables:
            for row in table:
                if len(row) >= 2:
                    raw_is[row[0].strip()] = row[1].strip()

        is_data = normalize_income_statement(raw_is, "seek")
        if not is_data:
            return {}

        # SEEK FY ends 30 June
        return {
            "period": {
                "companySlug": "seek",
                "periodType": "annual",
                "fiscalYear": fiscal_year,
                "periodLabel": f"FY{fiscal_year}",
                "startDate": f"{fiscal_year - 1}-07-01",
                "endDate": f"{fiscal_year}-06-30",
                "currency": "AUD",
                "unit": "millions",
                "source": f"SEEK Annual Report FY{fiscal_year}",
            },
            "incomeStatement": is_data,
            "balanceSheet": {},
            "cashFlow": {},
            "platformMetrics": {},
        }


if __name__ == "__main__":
    scraper = SeekScraper()
    events = scraper.scrape_earnings_calendar()
    print(f"Found {len(events)} SEEK earnings events")
    for e in events:
        print(f"  {e['announcedDate']} — {e['periodLabel']}")

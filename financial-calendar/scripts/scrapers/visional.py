"""
Visional (TSE:4194) scraper.

Sources:
  - English IR page: https://visional.inc/en/ir/
  - TDnet English PDF briefs (quarterly "Brief Financial Results")
  - Visional FY ends 31 July
"""

import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from scripts.base_scraper import BaseScraper
from scripts.parsers.pdf_table import extract_tables_from_bytes, find_page_with_keyword
from scripts.parsers.normalizer import normalize_income_statement

DATA_ROOT = Path(__file__).parent.parent.parent / "data"
IR_URL = "https://visional.inc/en/ir/library/results.html"
IR_BASE = "https://visional.inc"


class VisionalScraper(BaseScraper):
    RATE_LIMIT_SECS = 2.0

    def scrape_earnings_calendar(self) -> list[dict]:
        html = self.fetch_html(IR_URL)
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")

        events = []
        for item in soup.find_all(["li", "tr", "div"]):
            text = item.get_text(" ", strip=True)
            date_match = re.search(r"(\d{4})[./](\d{1,2})[./](\d{1,2})", text)
            if date_match and any(kw in text.lower() for kw in ["results", "financial"]):
                y, m, d = date_match.groups()
                date = f"{y}-{m.zfill(2)}-{d.zfill(2)}"
                fy_match = re.search(r"FY(\d{4})", text, re.IGNORECASE)
                fy = fy_match.group(1) if fy_match else y
                events.append({
                    "id": f"visional-{date}",
                    "companySlug": "visional",
                    "companyName": "Visional, Inc.",
                    "ticker": "4194",
                    "exchange": "TSE",
                    "periodLabel": f"FY{fy}",
                    "announcedDate": date,
                    "status": "reported",
                })
        return sorted(events, key=lambda e: e["announcedDate"])

    def scrape_financials(self, fiscal_year: int) -> dict:
        html = self.fetch_html(IR_URL)
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")

        pdf_url = None
        for a in soup.find_all("a", href=True):
            href = a["href"]
            text = a.get_text(strip=True).lower()
            if href.lower().endswith(".pdf") and str(fiscal_year) in text:
                pdf_url = href if href.startswith("http") else IR_BASE + href
                break

        if not pdf_url:
            print(f"  No PDF found for Visional FY{fiscal_year}. Using seed data.")
            return {}

        pdf_bytes = self.fetch_pdf_bytes(pdf_url)
        page_idx = find_page_with_keyword(pdf_bytes, "Revenue")
        tables = extract_tables_from_bytes(
            pdf_bytes, (page_idx, page_idx + 5) if page_idx is not None else None
        )

        raw_is: dict[str, str] = {}
        for table in tables:
            for row in table:
                if len(row) >= 2:
                    raw_is[row[0].strip()] = row[1].strip()

        is_data = normalize_income_statement(raw_is, "visional")
        if not is_data:
            return {}

        # Visional FY ends 31 July
        return {
            "period": {
                "companySlug": "visional",
                "periodType": "annual",
                "fiscalYear": fiscal_year,
                "periodLabel": f"FY{fiscal_year}",
                "startDate": f"{fiscal_year - 1}-08-01",
                "endDate": f"{fiscal_year}-07-31",
                "currency": "JPY",
                "unit": "millions",
                "source": f"Visional Annual Results FY{fiscal_year}",
            },
            "incomeStatement": is_data,
            "balanceSheet": {},
            "cashFlow": {},
            "platformMetrics": {},
        }

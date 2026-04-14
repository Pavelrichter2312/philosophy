"""
Recruit Holdings (TSE:6098) scraper.

Sources:
  - IR page: https://recruit-holdings.com/en/ir/
  - Quarterly results PDFs and HTML summaries from TDnet (via IR page links)
  - English quarterly financial summaries published as PDF each quarter

Strategy:
1. Fetch the IR page and find links to quarterly/annual result PDFs
2. Download and parse PDFs with pdfplumber
3. Extract income statement, balance sheet, cash flow, and platform metrics
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from scripts.base_scraper import BaseScraper
from scripts.parsers.html_table import extract_tables, parse_number
from scripts.parsers.pdf_table import extract_tables_from_bytes, find_page_with_keyword
from scripts.parsers.normalizer import normalize_income_statement

DATA_ROOT = Path(__file__).parent.parent.parent / "data"
IR_BASE = "https://recruit-holdings.com"
IR_URL = "https://recruit-holdings.com/en/ir/library/results.html"


class RecruitHoldingsScraper(BaseScraper):
    RATE_LIMIT_SECS = 2.0

    def scrape_earnings_calendar(self) -> list[dict]:
        """Scrape earnings dates from the Recruit Holdings IR results page."""
        html = self.fetch_html(IR_URL)
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")

        events = []
        # Look for date patterns and result links in the IR page
        for item in soup.find_all(["li", "div", "tr"]):
            text = item.get_text(" ", strip=True)
            date_match = re.search(r"(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})", text)
            if date_match and any(kw in text.lower() for kw in ["results", "financial", "quarterly"]):
                year, month, day = date_match.groups()
                date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                fy_match = re.search(r"FY(\d{4})|fiscal (\d{4})", text, re.IGNORECASE)
                fy = fy_match.group(1) or fy_match.group(2) if fy_match else year
                period_label = f"FY{fy}" if "annual" in text.lower() or "full year" in text.lower() else f"Q FY{fy}"

                events.append({
                    "id": f"recruit-holdings-{date}",
                    "companySlug": "recruit-holdings",
                    "companyName": "Recruit Holdings Co., Ltd.",
                    "ticker": "6098",
                    "exchange": "TSE",
                    "periodLabel": period_label,
                    "announcedDate": date,
                    "status": "reported",
                })

        return sorted(set(map(lambda e: json.dumps(e), events)),
                      key=lambda x: json.loads(x)["announcedDate"])

    def scrape_financials(self, fiscal_year: int) -> dict:
        """
        Scrape annual financial data for Recruit Holdings.

        Recruit Holdings FY ends 31 March.
        FY2025 = April 2024 – March 2025.
        """
        html = self.fetch_html(IR_URL)
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")

        # Find PDF link for the target FY annual results
        pdf_url = None
        for a in soup.find_all("a", href=True):
            href = a["href"]
            text = a.get_text(strip=True).lower()
            if (
                href.lower().endswith(".pdf")
                and str(fiscal_year) in text
                and any(kw in text for kw in ["annual", "full year", "financial results"])
            ):
                pdf_url = href if href.startswith("http") else IR_BASE + href
                break

        if not pdf_url:
            print(f"  No annual results PDF found for FY{fiscal_year}. Using seed data.")
            return {}

        pdf_bytes = self.fetch_pdf_bytes(pdf_url)
        page_idx = find_page_with_keyword(pdf_bytes, "Revenue")
        tables = extract_tables_from_bytes(
            pdf_bytes, (page_idx, page_idx + 6) if page_idx is not None else None
        )

        raw_is: dict[str, str] = {}
        for table in tables:
            for row in table:
                if len(row) >= 2 and row[0].strip():
                    raw_is[row[0].strip()] = row[1].strip()

        is_data = normalize_income_statement(raw_is, "recruit-holdings")
        if not is_data:
            return {}

        # Recruit Holdings FY: April to March (e.g., FY2025 = Apr 2024 – Mar 2025)
        return {
            "period": {
                "companySlug": "recruit-holdings",
                "periodType": "annual",
                "fiscalYear": fiscal_year,
                "periodLabel": f"FY{fiscal_year}",
                "startDate": f"{fiscal_year - 1}-04-01",
                "endDate": f"{fiscal_year}-03-31",
                "currency": "JPY",
                "unit": "millions",
                "source": f"Recruit Holdings Annual Results FY{fiscal_year}",
            },
            "incomeStatement": is_data,
            "balanceSheet": {},
            "cashFlow": {},
            "platformMetrics": {},
        }


if __name__ == "__main__":
    scraper = RecruitHoldingsScraper()
    data = scraper.scrape_financials(2025)
    if data:
        out = DATA_ROOT / "financials" / "recruit-holdings" / "fy2025_scraped.json"
        scraper.write_output(out, {
            "companySlug": "recruit-holdings",
            "lastScraped": datetime.utcnow().isoformat() + "Z",
            "periods": [data],
        })

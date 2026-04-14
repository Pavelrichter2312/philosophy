"""
Info Edge (NSE:NAUKRI) scraper.

Sources:
  - BSE filing API: https://api.bseindia.com (BSE scrip code: 532777)
  - NSE/BSE quarterly results PDFs
  - Info Edge IR page: https://infoedge.in/investor-relations.htm
  - FY ends 31 March
"""

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

BSE_SCRIP = "532777"
BSE_RESULTS_API = (
    f"https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w"
    f"?strCat=Result&strScrip={BSE_SCRIP}&strSearch=P&strType=C"
)
IR_URL = "https://infoedge.in/investor-relations.htm"
IR_BASE = "https://infoedge.in"


class InfoEdgeScraper(BaseScraper):
    RATE_LIMIT_SECS = 2.5

    def scrape_earnings_calendar(self) -> list[dict]:
        try:
            html = self.fetch_html(BSE_RESULTS_API)
            import json
            data = json.loads(html)
            announcements = data.get("Table", [])
        except Exception:
            announcements = []

        events = []
        for ann in announcements:
            date = ann.get("DT_TM", "")[:10]
            headline = ann.get("HEADLINE", "")
            if date and any(kw in headline.lower() for kw in ["financial results", "quarterly"]):
                quarter_match = re.search(r"Q(\d)\s*FY(\d{2})", headline, re.IGNORECASE)
                if quarter_match:
                    q, fy_short = quarter_match.groups()
                    fy = "20" + fy_short
                    period_label = f"Q{q} FY{fy}"
                else:
                    period_label = headline[:30]

                events.append({
                    "id": f"infoedge-{date}",
                    "companySlug": "infoedge",
                    "companyName": "Info Edge (India) Limited",
                    "ticker": "NAUKRI",
                    "exchange": "NSE",
                    "periodLabel": period_label,
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
            if href.lower().endswith(".pdf") and str(fiscal_year) in text and "annual" in text:
                pdf_url = href if href.startswith("http") else IR_BASE + href
                break

        if not pdf_url:
            print(f"  No PDF for Info Edge FY{fiscal_year}. Using seed data.")
            return {}

        pdf_bytes = self.fetch_pdf_bytes(pdf_url)
        page_idx = find_page_with_keyword(pdf_bytes, "Revenue from operations")
        tables = extract_tables_from_bytes(
            pdf_bytes, (page_idx, page_idx + 5) if page_idx is not None else None
        )

        raw_is: dict[str, str] = {}
        for table in tables:
            for row in table:
                if len(row) >= 2:
                    raw_is[row[0].strip()] = row[1].strip()

        is_data = normalize_income_statement(raw_is, "infoedge")
        if not is_data:
            return {}

        return {
            "period": {
                "companySlug": "infoedge",
                "periodType": "annual",
                "fiscalYear": fiscal_year,
                "periodLabel": f"FY{fiscal_year}",
                "startDate": f"{fiscal_year - 1}-04-01",
                "endDate": f"{fiscal_year}-03-31",
                "currency": "INR",
                "unit": "millions",
                "source": f"Info Edge Annual Results FY{fiscal_year}",
            },
            "incomeStatement": is_data,
            "balanceSheet": {},
            "cashFlow": {},
            "platformMetrics": {},
        }

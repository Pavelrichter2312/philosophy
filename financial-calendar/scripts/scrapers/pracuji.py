"""
Pracuji.cz scraper — Czech Business Registry (ARES/OR.justice.cz).

Czech statutory accounts are public. Filed as XBRL since 2018.
ARES search: https://wwwinfo.mfcr.cz/ares/ares_es.html.cz

Steps:
1. Find the company IČO (Czech company ID) in ARES
2. Fetch the annual statutory accounts XBRL/XML
3. Parse key financial figures
"""

import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from scripts.base_scraper import BaseScraper
from scripts.parsers.html_table import parse_number

DATA_ROOT = Path(__file__).parent.parent.parent / "data"

# Pracuji.cz s.r.o. — IČO to be confirmed via ARES search
ARES_SEARCH_URL = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat"
JUSTICE_BASE = "https://or.justice.cz"


class PracujiScraper(BaseScraper):
    RATE_LIMIT_SECS = 2.0

    def _find_ico(self) -> str | None:
        """Find Pracuji.cz IČO via ARES API."""
        import json
        url = f"https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat?obchodniJmeno=Pracuji&pocet=5"
        try:
            html = self.fetch_html(url)
            data = json.loads(html)
            for subj in data.get("ekonomickeSubjekty", []):
                if "pracuji" in subj.get("obchodniJmeno", "").lower():
                    return subj.get("ico")
        except Exception as e:
            print(f"  ARES search failed: {e}")
        return None

    def scrape_earnings_calendar(self) -> list[dict]:
        # Czech statutory accounts are filed annually by 30 June
        current_year = datetime.now().year
        events = []
        for fy in range(current_year - 3, current_year + 1):
            events.append({
                "id": f"pracuji-fy{fy}",
                "companySlug": "pracuji",
                "companyName": "Pracuji.cz s.r.o.",
                "ticker": "",
                "exchange": "PRIVATE",
                "periodLabel": f"FY{fy}",
                "announcedDate": f"{fy + 1}-06-30",  # filing deadline
                "status": "estimated" if fy >= current_year - 1 else "reported",
                "notes": "Czech statutory accounts filed with OR.justice.cz",
            })
        return events

    def scrape_financials(self, fiscal_year: int) -> dict:
        ico = self._find_ico()
        if not ico:
            print("  Could not find Pracuji IČO. Using seed data.")
            return {}

        # Fetch filing list from OR.justice.cz
        filing_url = f"{JUSTICE_BASE}/ias/ui/rejstrik-firma.vysledky?subjektId={ico}&typ=PLATNY"
        print(f"  Found IČO {ico}, fetching OR.justice.cz...")

        try:
            html = self.fetch_html(filing_url)
        except Exception as e:
            print(f"  OR.justice.cz fetch failed: {e}")
            return {}

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")

        # Find the annual report link for the target year
        report_link = None
        for a in soup.find_all("a", href=True):
            if str(fiscal_year) in a.get_text() and "výroční" in a.get_text().lower():
                report_link = a["href"]
                break

        if not report_link:
            print(f"  No annual report link found for FY{fiscal_year}")
            return {}

        # Parse basic financials from the filing page
        report_html = self.fetch_html(
            report_link if report_link.startswith("http") else JUSTICE_BASE + report_link
        )
        tables = __import__(
            "scripts.parsers.html_table", fromlist=["extract_tables"]
        ).extract_tables(report_html)

        raw = {}
        for table in tables:
            for row in table:
                if len(row) >= 2:
                    raw[row[0].strip()] = row[1].strip()

        revenue = parse_number(raw.get("Tržby z prodeje výrobků a služeb", ""))

        if not revenue:
            return {}

        return {
            "period": {
                "companySlug": "pracuji",
                "periodType": "annual",
                "fiscalYear": fiscal_year,
                "periodLabel": f"FY{fiscal_year}",
                "startDate": f"{fiscal_year}-01-01",
                "endDate": f"{fiscal_year}-12-31",
                "currency": "CZK",
                "unit": "thousands",
                "source": f"Czech OR.justice.cz FY{fiscal_year}",
            },
            "incomeStatement": {"revenue": revenue},
            "balanceSheet": {},
            "cashFlow": {},
            "platformMetrics": {},
        }

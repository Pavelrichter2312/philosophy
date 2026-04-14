"""
Kanzhun (BOSS Zhipin) scraper — SEC EDGAR 20-F.

CIK for Kanzhun: 0001819810
"""

import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from scripts.base_scraper import BaseScraper
from scripts.parsers.html_table import extract_tables
from scripts.parsers.normalizer import normalize_income_statement, normalize_platform_metrics

DATA_ROOT = Path(__file__).parent.parent.parent / "data"
CIK = "0001819810"
EDGAR_BASE = "https://data.sec.gov"


class KanzhunScraper(BaseScraper):
    RATE_LIMIT_SECS = 1.5

    def _get_filings(self, form_type: str = "20-F") -> list[dict]:
        url = f"{EDGAR_BASE}/submissions/CIK{CIK}.json"
        html = self.fetch_html(url, cache_ttl_hours=24)
        data = json.loads(html)
        filings = data.get("filings", {}).get("recent", {})
        forms = filings.get("form", [])
        dates = filings.get("filingDate", [])
        accessions = filings.get("accessionNumber", [])
        return [
            {"form": form, "date": date, "accession": acc}
            for form, date, acc in zip(forms, dates, accessions)
            if form == form_type
        ]

    def scrape_earnings_calendar(self) -> list[dict]:
        filings = self._get_filings("20-F") + self._get_filings("6-K")
        events = []
        for filing in filings:
            events.append({
                "id": f"kanzhun-{filing['form'].lower()}-{filing['date']}",
                "companySlug": "kanzhun",
                "companyName": "Kanzhun Limited",
                "ticker": "BZ",
                "exchange": "NASDAQ",
                "periodLabel": f"{filing['form']} {filing['date'][:7]}",
                "announcedDate": filing["date"],
                "status": "reported",
            })
        return sorted(events, key=lambda e: e["announcedDate"])

    def scrape_financials(self, fiscal_year: int) -> dict:
        filings = self._get_filings("20-F")
        # 20-F for FY2024 is typically filed in early 2025
        target = next(
            (f for f in filings if f["date"][:4] == str(fiscal_year + 1)),
            None
        )
        if not target:
            raise ValueError(f"No 20-F found for FY{fiscal_year}")

        acc = target["accession"].replace("-", "")
        index_url = f"{EDGAR_BASE}/Archives/edgar/data/{int(CIK)}/{acc}/{target['accession']}-index.json"

        try:
            index_html = self.fetch_html(index_url)
            index_data = json.loads(index_html)
            htm_file = next(
                (f["name"] for f in index_data.get("directory", {}).get("item", [])
                 if f["name"].endswith(".htm")),
                None
            )
        except Exception:
            htm_file = None

        if not htm_file:
            print(f"Could not find 20-F HTM for FY{fiscal_year}")
            return {}

        doc_url = f"{EDGAR_BASE}/Archives/edgar/data/{int(CIK)}/{acc}/{htm_file}"
        html = self.fetch_html(doc_url, cache_ttl_hours=168)
        tables = extract_tables(html)

        raw_is = {}
        for table in tables:
            for row in table:
                if len(row) >= 2 and any(kw in row[0].lower() for kw in ["revenue", "revenues"]):
                    for r in table:
                        if len(r) >= 2:
                            raw_is[r[0].strip()] = r[1].strip()
                    break

        is_data = normalize_income_statement(raw_is, "kanzhun")

        return {
            "period": {
                "companySlug": "kanzhun",
                "periodType": "annual",
                "fiscalYear": fiscal_year,
                "periodLabel": f"FY{fiscal_year}",
                "startDate": f"{fiscal_year}-01-01",
                "endDate": f"{fiscal_year}-12-31",
                "reportDate": target["date"],
                "currency": "CNY",
                "unit": "millions",
                "source": f"Kanzhun 20-F FY{fiscal_year}",
            },
            "incomeStatement": is_data,
            "balanceSheet": {},
            "cashFlow": {},
            "platformMetrics": {},
        }


if __name__ == "__main__":
    scraper = KanzhunScraper()
    data = scraper.scrape_financials(2024)
    if data:
        out = DATA_ROOT / "financials" / "kanzhun" / "fy2024_scraped.json"
        scraper.write_output(out, {
            "companySlug": "kanzhun",
            "lastScraped": datetime.utcnow().isoformat() + "Z",
            "periods": [data],
        })

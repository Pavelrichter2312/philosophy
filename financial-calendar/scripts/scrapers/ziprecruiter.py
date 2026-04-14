"""
ZipRecruiter scraper — SEC EDGAR 10-K/10-Q.

Usage:
    python -m scripts.scrapers.ziprecruiter --year 2024

Data sources:
  - SEC EDGAR full-text search: https://efts.sec.gov/LATEST/search-index
  - CIK for ZipRecruiter: 0001837303
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from scripts.base_scraper import BaseScraper
from scripts.parsers.html_table import extract_tables, parse_number
from scripts.parsers.normalizer import normalize_income_statement

DATA_ROOT = Path(__file__).parent.parent.parent / "data"
CIK = "0001837303"
EDGAR_BASE = "https://data.sec.gov"


class ZipRecruiterScraper(BaseScraper):
    RATE_LIMIT_SECS = 1.5

    def _get_filings(self, form_type: str = "10-K") -> list[dict]:
        url = f"{EDGAR_BASE}/submissions/CIK{CIK}.json"
        html = self.fetch_html(url, cache_ttl_hours=24)
        data = json.loads(html)
        filings = data.get("filings", {}).get("recent", {})
        forms = filings.get("form", [])
        dates = filings.get("filingDate", [])
        accessions = filings.get("accessionNumber", [])
        result = []
        for form, date, acc in zip(forms, dates, accessions):
            if form == form_type:
                result.append({"form": form, "date": date, "accession": acc})
        return result

    def scrape_earnings_calendar(self) -> list[dict]:
        filings = self._get_filings("10-K") + self._get_filings("10-Q")
        events = []
        for filing in filings:
            period_label = f"10-K {filing['date'][:4]}" if filing["form"] == "10-K" else f"10-Q {filing['date']}"
            events.append({
                "id": f"ziprecruiter-{filing['date']}",
                "companySlug": "ziprecruiter",
                "companyName": "ZipRecruiter, Inc.",
                "ticker": "ZIP",
                "exchange": "NASDAQ",
                "periodLabel": period_label,
                "announcedDate": filing["date"],
                "status": "reported",
            })
        return sorted(events, key=lambda e: e["announcedDate"])

    def scrape_financials(self, fiscal_year: int) -> dict:
        """Scrape 10-K for the given calendar fiscal year."""
        filings = self._get_filings("10-K")
        target = next(
            (f for f in filings if f["date"].startswith(str(fiscal_year + 1)[:3])),
            None
        )
        if not target:
            raise ValueError(f"No 10-K found for fiscal year {fiscal_year}")

        acc = target["accession"].replace("-", "")
        index_url = f"{EDGAR_BASE}/Archives/edgar/data/{int(CIK)}/{acc}/{target['accession']}-index.json"

        try:
            index_html = self.fetch_html(index_url)
            index_data = json.loads(index_html)
            htm_file = next(
                (f["name"] for f in index_data.get("directory", {}).get("item", [])
                 if f["name"].endswith(".htm") and "10k" in f["name"].lower()),
                None
            )
        except Exception:
            htm_file = None

        if not htm_file:
            print(f"Could not find 10-K HTM for {fiscal_year}, using seed data.")
            return {}

        doc_url = f"{EDGAR_BASE}/Archives/edgar/data/{int(CIK)}/{acc}/{htm_file}"
        html = self.fetch_html(doc_url, cache_ttl_hours=168)
        tables = extract_tables(html)

        # Find income statement table (look for "Revenue" row)
        raw_is = {}
        for table in tables:
            for row in table:
                if len(row) >= 2 and "revenue" in row[0].lower():
                    for r in table:
                        if len(r) >= 2:
                            raw_is[r[0].strip()] = r[1].strip()
                    break

        is_data = normalize_income_statement(raw_is, "ziprecruiter")

        return {
            "period": {
                "companySlug": "ziprecruiter",
                "periodType": "annual",
                "fiscalYear": fiscal_year,
                "periodLabel": f"FY{fiscal_year}",
                "startDate": f"{fiscal_year}-01-01",
                "endDate": f"{fiscal_year}-12-31",
                "reportDate": target["date"],
                "currency": "USD",
                "unit": "thousands",
                "source": f"ZipRecruiter 10-K {fiscal_year}",
            },
            "incomeStatement": is_data,
            "balanceSheet": {},
            "cashFlow": {},
            "platformMetrics": {},
        }


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=2024)
    args = parser.parse_args()

    scraper = ZipRecruiterScraper()
    print(f"Scraping ZipRecruiter FY{args.year}...")

    data = scraper.scrape_financials(args.year)
    if data:
        out = DATA_ROOT / "financials" / "ziprecruiter" / f"fy{args.year}.json"
        scraper.write_output(out, {
            "companySlug": "ziprecruiter",
            "lastScraped": datetime.utcnow().isoformat() + "Z",
            "periods": [data],
        })

    events = scraper.scrape_earnings_calendar()
    out_events = DATA_ROOT / "earnings" / "ziprecruiter.json"
    scraper.write_output(out_events, {
        "companySlug": "ziprecruiter",
        "events": events,
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
    })


if __name__ == "__main__":
    main()

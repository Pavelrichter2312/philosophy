"""
Ingest orchestrator — runs scrapers and updates JSON data files.

Usage:
    python scripts/ingest.py                    # run all scrapers
    python scripts/ingest.py --company seek     # run one company
    python scripts/ingest.py --company ziprecruiter --year 2024
"""

import argparse
import sys
import traceback
from pathlib import Path

# Ensure project root is on path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))


def run_ziprecruiter(year: int):
    from scripts.scrapers.ziprecruiter import ZipRecruiterScraper
    scraper = ZipRecruiterScraper()
    print("ZipRecruiter: scraping earnings calendar...")
    events = scraper.scrape_earnings_calendar()
    scraper.write_output(
        ROOT / "data" / "earnings" / "ziprecruiter.json",
        {"companySlug": "ziprecruiter", "events": events, "lastUpdated": _now()},
    )
    print(f"ZipRecruiter: scraped {len(events)} events")

    print(f"ZipRecruiter: scraping financials FY{year}...")
    try:
        data = scraper.scrape_financials(year)
        if data:
            from datetime import datetime
            scraper.write_output(
                ROOT / "data" / "financials" / "ziprecruiter" / f"fy{year}_scraped.json",
                {"companySlug": "ziprecruiter", "lastScraped": _now(), "periods": [data]},
            )
    except Exception as e:
        print(f"  Warning: {e}")


def run_kanzhun(year: int):
    from scripts.scrapers.kanzhun import KanzhunScraper
    scraper = KanzhunScraper()
    print("Kanzhun: scraping earnings calendar...")
    events = scraper.scrape_earnings_calendar()
    scraper.write_output(
        ROOT / "data" / "earnings" / "kanzhun.json",
        {"companySlug": "kanzhun", "events": events, "lastUpdated": _now()},
    )
    print(f"Kanzhun: scraped {len(events)} events")


def run_seek(year: int):
    from scripts.scrapers.seek import SeekScraper
    scraper = SeekScraper()
    print("SEEK: scraping earnings calendar...")
    try:
        events = scraper.scrape_earnings_calendar()
        if events:
            scraper.write_output(
                ROOT / "data" / "earnings" / "seek.json",
                {"companySlug": "seek", "events": events, "lastUpdated": _now()},
            )
            print(f"SEEK: scraped {len(events)} events")
    except Exception as e:
        print(f"  SEEK calendar warning: {e}")


def run_recruit_holdings(year: int):
    from scripts.scrapers.recruit_holdings import RecruitHoldingsScraper
    scraper = RecruitHoldingsScraper()
    print("Recruit Holdings: scraping financials...")
    try:
        data = scraper.scrape_financials(year)
        if data:
            scraper.write_output(
                ROOT / "data" / "financials" / "recruit-holdings" / f"fy{year}_scraped.json",
                {"companySlug": "recruit-holdings", "lastScraped": _now(), "periods": [data]},
            )
    except Exception as e:
        print(f"  Recruit Holdings warning: {e}")


def run_visional(year: int):
    from scripts.scrapers.visional import VisionalScraper
    scraper = VisionalScraper()
    print("Visional: scraping financials...")
    try:
        data = scraper.scrape_financials(year)
        if data:
            scraper.write_output(
                ROOT / "data" / "financials" / "visional" / f"fy{year}_scraped.json",
                {"companySlug": "visional", "lastScraped": _now(), "periods": [data]},
            )
    except Exception as e:
        print(f"  Visional warning: {e}")


def run_infoedge(year: int):
    from scripts.scrapers.infoedge import InfoEdgeScraper
    scraper = InfoEdgeScraper()
    print("Info Edge: scraping earnings calendar...")
    try:
        events = scraper.scrape_earnings_calendar()
        if events:
            scraper.write_output(
                ROOT / "data" / "earnings" / "infoedge.json",
                {"companySlug": "infoedge", "events": events, "lastUpdated": _now()},
            )
    except Exception as e:
        print(f"  Info Edge warning: {e}")


def run_pracuji(year: int):
    from scripts.scrapers.pracuji import PracujiScraper
    scraper = PracujiScraper()
    print("Pracuji: scraping earnings calendar...")
    events = scraper.scrape_earnings_calendar()
    scraper.write_output(
        ROOT / "data" / "earnings" / "pracuji.json",
        {"companySlug": "pracuji", "events": events, "lastUpdated": _now()},
    )


def _now() -> str:
    from datetime import datetime
    return datetime.utcnow().isoformat() + "Z"


SCRAPERS = {
    "ziprecruiter": run_ziprecruiter,
    "kanzhun": run_kanzhun,
    "seek": run_seek,
    "recruit-holdings": run_recruit_holdings,
    "visional": run_visional,
    "infoedge": run_infoedge,
    "pracuji": run_pracuji,
}


def main():
    parser = argparse.ArgumentParser(description="Run financial data scrapers")
    parser.add_argument("--company", type=str, help="Company slug (default: all)")
    parser.add_argument("--year", type=int, default=2024, help="Fiscal year to scrape")
    args = parser.parse_args()

    if args.company:
        if args.company not in SCRAPERS:
            print(f"Unknown company: {args.company}. Options: {list(SCRAPERS.keys())}")
            sys.exit(1)
        print(f"\n=== Running scraper: {args.company} ===")
        try:
            SCRAPERS[args.company](args.year)
        except Exception:
            traceback.print_exc()
    else:
        print("=== Running all scrapers ===")
        for name, fn in SCRAPERS.items():
            print(f"\n--- {name} ---")
            try:
                fn(args.year)
            except Exception:
                traceback.print_exc()
                print(f"  FAILED: {name}")

    print("\nDone.")


if __name__ == "__main__":
    main()

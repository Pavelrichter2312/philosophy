"""Base scraper with caching, rate limiting, and retry logic."""

import hashlib
import json
import time
from abc import ABC, abstractmethod
from pathlib import Path

import requests

CACHE_DIR = Path(__file__).parent / ".scrape_cache"
CACHE_DIR.mkdir(exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; FinCal/1.0 financial research bot)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


class BaseScraper(ABC):
    RATE_LIMIT_SECS = 2.0
    MAX_RETRIES = 3

    def _cache_path(self, url: str) -> Path:
        key = hashlib.md5(url.encode()).hexdigest()
        return CACHE_DIR / f"{key}.cache"

    def fetch_html(self, url: str, cache_ttl_hours: int = 24) -> str:
        """Fetch URL with local disk caching and rate limiting."""
        cache_file = self._cache_path(url)
        if cache_file.exists():
            age_hours = (time.time() - cache_file.stat().st_mtime) / 3600
            if age_hours < cache_ttl_hours:
                return cache_file.read_text(encoding="utf-8")

        time.sleep(self.RATE_LIMIT_SECS)
        for attempt in range(self.MAX_RETRIES):
            try:
                resp = requests.get(url, headers=HEADERS, timeout=30)
                resp.raise_for_status()
                html = resp.text
                cache_file.write_text(html, encoding="utf-8")
                return html
            except requests.RequestException as e:
                if attempt == self.MAX_RETRIES - 1:
                    raise
                wait = 2 ** (attempt + 1)
                print(f"Retry {attempt + 1}/{self.MAX_RETRIES} after {wait}s: {e}")
                time.sleep(wait)

        raise RuntimeError(f"Failed to fetch {url}")

    def fetch_pdf_bytes(self, url: str, cache_ttl_hours: int = 168) -> bytes:
        """Fetch PDF bytes with caching."""
        cache_file = self._cache_path(url + ".pdf")
        if cache_file.exists():
            age_hours = (time.time() - cache_file.stat().st_mtime) / 3600
            if age_hours < cache_ttl_hours:
                return cache_file.read_bytes()

        time.sleep(self.RATE_LIMIT_SECS)
        resp = requests.get(url, headers=HEADERS, timeout=60)
        resp.raise_for_status()
        data = resp.content
        cache_file.write_bytes(data)
        return data

    def write_output(self, output_path: Path, data: dict) -> None:
        """Write scraped data as pretty JSON."""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"Written: {output_path}")

    @abstractmethod
    def scrape_earnings_calendar(self) -> list[dict]:
        """Return list of earnings event dicts matching EarningsEvent schema."""
        ...

    @abstractmethod
    def scrape_financials(self, fiscal_year: int) -> dict:
        """Return dict matching FinancialPeriodRecord schema for given FY."""
        ...

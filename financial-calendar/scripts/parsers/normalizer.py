"""
Maps raw scraped key-value dicts to the canonical FinancialPeriodRecord schema.
Each company has a FIELD_MAP: raw_label -> canonical_field_name.
"""

from typing import Optional
from .html_table import parse_number

# ── Field maps ─────────────────────────────────────────────────────────────────

SEEK_IS_MAP = {
    "Revenue": "revenue",
    "Total revenue": "revenue",
    "EBITDA": "ebitda",
    "EBIT": "operatingIncome",
    "Operating profit": "operatingIncome",
    "Net profit after tax": "netIncome",
    "Net profit": "netIncome",
    "Basic EPS": "eps",
    "Diluted EPS": "epsDiluted",
}

SEEK_CF_MAP = {
    "Cash flows from operating activities": "operatingCashFlow",
    "Net cash from operating activities": "operatingCashFlow",
    "Capital expenditure": "capitalExpenditures",
    "Net cash used in investing activities": "investingCashFlow",
    "Net cash used in financing activities": "financingCashFlow",
}

KANZHUN_IS_MAP = {
    "Revenues": "revenue",
    "Total revenues": "revenue",
    "Gross profit": "grossProfit",
    "Operating income (loss)": "operatingIncome",
    "Net income (loss)": "netIncome",
    "Basic net income (loss) per ADS": "eps",
    "Diluted net income (loss) per ADS": "epsDiluted",
}

KANZHUN_PLATFORM_MAP = {
    "Paid enterprise customers": "paidClientsOrSubscribers",
    "Average revenue per paid enterprise customer": "arpuValue",
}

ZIPRECRUITER_IS_MAP = {
    "Revenue": "revenue",
    "Cost of revenue": "costOfRevenue",
    "Gross profit": "grossProfit",
    "Income (loss) from operations": "operatingIncome",
    "Net income (loss)": "netIncome",
    "Basic net income (loss) per share": "eps",
    "Diluted net income (loss) per share": "epsDiluted",
}

ZIPRECRUITER_PLATFORM_MAP = {
    "Quarterly paid employers": "paidClientsOrSubscribers",
}

VISIONAL_IS_MAP = {
    "Revenue": "revenue",
    "Operating profit": "operatingIncome",
    "Profit attributable to owners": "netIncome",
    "Earnings per share (basic)": "eps",
}

VISIONAL_PLATFORM_MAP = {
    "Paid members": "paidClientsOrSubscribers",
}

INFOEDGE_IS_MAP = {
    "Revenue from operations": "revenue",
    "Total revenue": "revenue",
    "EBITDA": "ebitda",
    "Profit before tax": "pretaxIncome",
    "Profit after tax": "netIncome",
    "Basic EPS": "eps",
    "Diluted EPS": "epsDiluted",
}

RECRUIT_IS_MAP = {
    "Revenue": "revenue",
    "Adjusted EBITDA": "ebitda",
    "Adjusted EBIT": "operatingIncome",
    "Net income": "netIncome",
    "Basic EPS": "eps",
}

COMPANY_IS_MAPS = {
    "seek": SEEK_IS_MAP,
    "kanzhun": KANZHUN_IS_MAP,
    "ziprecruiter": ZIPRECRUITER_IS_MAP,
    "visional": VISIONAL_IS_MAP,
    "infoedge": INFOEDGE_IS_MAP,
    "recruit-holdings": RECRUIT_IS_MAP,
}

COMPANY_PLATFORM_MAPS = {
    "kanzhun": KANZHUN_PLATFORM_MAP,
    "ziprecruiter": ZIPRECRUITER_PLATFORM_MAP,
    "visional": VISIONAL_PLATFORM_MAP,
}


def normalize_income_statement(raw: dict[str, str], company_slug: str) -> dict:
    """Map raw label->value dict to canonical IncomeStatement fields."""
    field_map = COMPANY_IS_MAPS.get(company_slug, {})
    result = {}
    for raw_label, value_str in raw.items():
        canonical = field_map.get(raw_label)
        if canonical:
            value = parse_number(value_str)
            if value is not None:
                result[canonical] = value

    # Derived fields
    if "revenue" in result and "grossProfit" in result:
        result["grossMargin"] = result["grossProfit"] / result["revenue"]
    if "revenue" in result and "operatingIncome" in result:
        result["operatingMargin"] = result["operatingIncome"] / result["revenue"]
    if "revenue" in result and "netIncome" in result:
        result["netMargin"] = result["netIncome"] / result["revenue"]
    if "revenue" in result and "ebitda" in result:
        result["ebitdaMargin"] = result["ebitda"] / result["revenue"]

    return result


def normalize_platform_metrics(raw: dict[str, str], company_slug: str) -> dict:
    """Map raw label->value dict to canonical PlatformMetrics fields."""
    field_map = COMPANY_PLATFORM_MAPS.get(company_slug, {})
    result = {}
    for raw_label, value_str in raw.items():
        canonical = field_map.get(raw_label)
        if canonical:
            value = parse_number(value_str)
            if value is not None:
                result[canonical] = value
    return result

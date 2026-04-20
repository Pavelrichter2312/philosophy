"""
Сбор данных о вакансиях с портала «Работа России» (trudvsem.ru)
Результат: Excel-файл с профессиями по строкам и месяцами по столбцам.

Требования:
    pip install requests pandas openpyxl python-dateutil tqdm

Запуск:
    python collect_vacancies.py

Примечание: API требует российский IP-адрес.
"""

import os
import sys
import time
import json
import requests
import pandas as pd
from datetime import datetime
from dateutil.relativedelta import relativedelta

BASE_URL = "http://opendata.trudvsem.ru/api/v1/vacancies"
OUTPUT_FILE = "vacancies_by_profession.xlsx"
CHECKPOINT_FILE = "vacancies_checkpoint.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; research-bot/1.0)",
    "Accept": "application/json",
}

START_DATE = datetime(2018, 1, 1)
END_DATE = datetime(2026, 4, 1)


def fetch_month(year: int, month: int) -> dict[str, int]:
    """Возвращает словарь {профессия: кол-во вакансий} за указанный месяц."""
    start = datetime(year, month, 1)
    end = start + relativedelta(months=1) - relativedelta(seconds=1)
    counts: dict[str, int] = {}
    offset = 0
    limit = 100
    total = None

    while True:
        params = {
            "limit": limit,
            "offset": offset,
            "modifiedFrom": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "modifiedTo": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        try:
            r = requests.get(BASE_URL, params=params, headers=HEADERS, timeout=30)
            r.raise_for_status()
            data = r.json()
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 403:
                print("\n[ОШИБКА] API вернул 403 Forbidden.")
                print("Портал trudvsem.ru доступен только с российских IP-адресов.")
                print("Запустите скрипт с российского сервера или через VPN (Россия).")
                sys.exit(1)
            print(f"  HTTP ошибка: {e}")
            break
        except Exception as e:
            print(f"  Ошибка запроса: {e}")
            time.sleep(2)
            break

        if total is None:
            total = int(data.get("meta", {}).get("total", 0))

        vacancies = data.get("results", {}).get("vacancies", [])
        if not vacancies:
            break

        for item in vacancies:
            vac = item.get("vacancy", {})
            name = (vac.get("job-name") or "Не указано").strip()
            counts[name] = counts.get(name, 0) + 1

        offset += limit
        if offset >= total or offset >= 10000:
            break

        time.sleep(0.3)

    return counts


def load_checkpoint() -> dict:
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_checkpoint(data: dict):
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


def main():
    print("=== Сбор вакансий с trudvsem.ru ===")
    print(f"Период: {START_DATE:%Y-%m} — {END_DATE:%Y-%m}")
    print(f"Выходной файл: {OUTPUT_FILE}\n")

    checkpoint = load_checkpoint()
    rows = []

    current = START_DATE
    while current < END_DATE:
        month_label = current.strftime("%Y-%m")

        if month_label in checkpoint:
            print(f"  [{month_label}] из кэша ({sum(checkpoint[month_label].values())} вакансий)")
            counts = checkpoint[month_label]
        else:
            print(f"  [{month_label}] загружаю...", end=" ", flush=True)
            counts = fetch_month(current.year, current.month)
            total = sum(counts.values())
            print(f"{total} вакансий, {len(counts)} профессий")
            checkpoint[month_label] = counts
            save_checkpoint(checkpoint)

        for profession, count in counts.items():
            rows.append({"profession": profession, "month": month_label, "count": count})

        current += relativedelta(months=1)

    if not rows:
        print("\nДанные не получены. Проверьте доступность API.")
        return

    print("\nФормирую сводную таблицу...")
    df = pd.DataFrame(rows)
    pivot = df.pivot_table(
        index="profession",
        columns="month",
        values="count",
        aggfunc="sum",
        fill_value=0,
    )
    pivot.columns.name = None
    pivot.index.name = "Профессия"
    pivot.sort_index(inplace=True)

    print(f"Профессий (строк): {len(pivot)}")
    print(f"Месяцев (столбцов): {len(pivot.columns)}")

    pivot.to_excel(OUTPUT_FILE)
    print(f"\nГотово! Файл сохранён: {OUTPUT_FILE}")

    print("\nТоп-10 профессий по суммарному числу вакансий:")
    top = pivot.sum(axis=1).sort_values(ascending=False).head(10)
    for name, val in top.items():
        print(f"  {val:>8,}  {name}")


if __name__ == "__main__":
    main()

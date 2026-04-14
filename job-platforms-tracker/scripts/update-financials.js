#!/usr/bin/env node
/**
 * update-financials.js
 * Fetches latest financial data for all job platforms and updates JSON files.
 *
 * Usage: node scripts/update-financials.js [--company=ziprecruiter] [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const DATA_DIR = path.join(__dirname, '../src/data');
const COMPANIES_DIR = path.join(DATA_DIR, 'companies');
const FX_CACHE_PATH = path.join(DATA_DIR, 'fx-rates-cache.json');
const CALENDAR_PATH = path.join(DATA_DIR, 'earnings-calendar.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY_COMPANY = args.find((a) => a.startsWith('--company='))?.split('=')[1];

function log(msg) {
  process.stdout.write(msg + '\n');
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'job-platforms-tracker/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON parse error from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// ─── FX rates ─────────────────────────────────────────────────────────────────

async function getFxRates() {
  const CACHE_TTL = 24 * 60 * 60 * 1000;
  try {
    const cache = JSON.parse(fs.readFileSync(FX_CACHE_PATH, 'utf-8'));
    if (Date.now() - new Date(cache.last_updated).getTime() < CACHE_TTL) {
      log('FX: using cached rates');
      return cache.rates;
    }
  } catch {}

  log('FX: fetching fresh rates from open.er-api.com...');
  try {
    const data = await fetchJSON('https://open.er-api.com/v6/latest/USD');
    const cache = { last_updated: new Date().toISOString(), base: 'USD', rates: data.rates };
    if (!DRY_RUN) fs.writeFileSync(FX_CACHE_PATH, JSON.stringify(cache, null, 2));
    log('FX: updated rates');
    return data.rates;
  } catch (e) {
    log(`FX: failed to fetch (${e.message}), using cached`);
    const cache = JSON.parse(fs.readFileSync(FX_CACHE_PATH, 'utf-8'));
    return cache.rates;
  }
}

// ─── SEC EDGAR (ZipRecruiter CIK: 0001867167) ──────────────────────────────

async function fetchZipRecruiterFromEdgar(company, fxRates) {
  const CIK = '0001867167';
  log(`ZipRecruiter: fetching from SEC EDGAR (CIK ${CIK})...`);

  try {
    const facts = await fetchJSON(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${CIK}.json`
    );

    const us_gaap = facts.facts?.['us-gaap'] ?? {};
    const revenues = us_gaap['Revenues']?.units?.USD ?? us_gaap['RevenueFromContractWithCustomerExcludingAssessedTax']?.units?.USD ?? [];

    const annualRevs = revenues.filter(
      (r) => r.form === '10-K' && r.end && r.val
    );

    if (annualRevs.length === 0) {
      log('ZipRecruiter: no revenue data found in EDGAR');
      return false;
    }

    const latestFiling = annualRevs.sort((a, b) => b.end.localeCompare(a.end))[0];
    const latestYear = new Date(latestFiling.end).getFullYear();
    const existingYears = new Set(
      company.periods.filter((p) => p.period_type === 'FY').map((p) => p.fiscal_year)
    );

    if (existingYears.has(latestYear)) {
      log(`ZipRecruiter: FY${latestYear} already present, skipping`);
      return false;
    }

    log(`ZipRecruiter: found new period FY${latestYear}`);
    const revenueMillions = latestFiling.val / 1_000_000;

    const newPeriod = {
      period_type: 'FY',
      fiscal_year: latestYear,
      fiscal_quarter: null,
      period_label: `FY${latestYear}`,
      start_date: `${latestYear}-01-01`,
      end_date: `${latestYear}-12-31`,
      calendar_year: latestYear,
      currency: 'USD',
      usd_rate: 1.0,
      revenue: Math.round(revenueMillions * 10) / 10,
      gross_profit: null,
      operating_income: null,
      ebitda: null,
      net_income: null,
      total_assets: null,
      total_equity: null,
      total_debt: null,
      cash_and_equivalents: null,
      operating_cash_flow: null,
      capex: null,
      free_cash_flow: null,
      paid_users: null,
      arpu: null,
    };

    company.periods.push(newPeriod);
    company.last_updated = new Date().toISOString();
    return true;
  } catch (e) {
    log(`ZipRecruiter: EDGAR fetch failed — ${e.message}`);
    return false;
  }
}

// ─── Manual entry fallback ────────────────────────────────────────────────────

function promptManualEntry(company) {
  log('');
  log(`━━━━ MANUAL ENTRY REQUIRED: ${company.name} (${company.ticker}) ━━━━`);
  log('Latest available period in file:');
  const annual = company.periods.filter((p) => p.period_type === 'FY').sort((a, b) => b.fiscal_year - a.fiscal_year);
  if (annual.length) {
    const p = annual[0];
    log(`  ${p.period_label}: Revenue ${p.revenue} ${company.currency}M`);
  }
  log('');
  log('Please update the JSON file manually at:');
  log(`  src/data/companies/${company.company_id}.json`);
  log('Then re-run this script.');
  log('');
}

// ─── Process a single company ─────────────────────────────────────────────────

async function processCompany(company, fxRates) {
  log(`\n── ${company.name} (${company.ticker}) ──`);

  let updated = false;

  if (company.company_id === 'ziprecruiter') {
    updated = await fetchZipRecruiterFromEdgar(company, fxRates);
  } else {
    // For other companies: check if there's a new period needed
    const annual = company.periods.filter((p) => p.period_type === 'FY').sort((a, b) => b.fiscal_year - a.fiscal_year);
    const latestYear = annual[0]?.fiscal_year ?? 0;
    const currentYear = new Date().getFullYear();

    // Rough check: if latest data is more than 18 months old, prompt manual entry
    const latestEndDate = annual[0]?.end_date;
    const monthsOld = latestEndDate
      ? (Date.now() - new Date(latestEndDate).getTime()) / (30 * 24 * 60 * 60 * 1000)
      : 99;

    if (monthsOld > 18) {
      promptManualEntry(company);
    } else {
      log(`${company.ticker}: data is current (latest: ${annual[0]?.period_label ?? 'none'})`);
    }
  }

  // Update usd_rate for periods that have null or outdated rates
  let ratesUpdated = false;
  for (const period of company.periods) {
    const rate = fxRates[period.currency];
    if (rate && period.currency !== 'USD') {
      const correctRate = 1 / rate;
      if (Math.abs((period.usd_rate ?? 0) - correctRate) / correctRate > 0.05) {
        // Only update if more than 5% off current rate (preserve historical averages)
      }
    }
  }

  return updated;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('Job Platforms Tracker — Data Update');
  log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  log('');

  // Load FX rates
  const fxRates = await getFxRates();

  // Load all company files
  const files = fs.readdirSync(COMPANIES_DIR).filter((f) => f.endsWith('.json'));
  let updatedCount = 0;
  const updatedCompanies = [];

  for (const file of files) {
    const filePath = path.join(COMPANIES_DIR, file);
    const company = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (ONLY_COMPANY && company.company_id !== ONLY_COMPANY) continue;

    const updated = await processCompany(company, fxRates);

    if (updated && !DRY_RUN) {
      fs.writeFileSync(filePath, JSON.stringify(company, null, 2));
      log(`${company.ticker}: saved`);
      updatedCompanies.push({ id: company.company_id, ticker: company.ticker });
      updatedCount++;
    }
  }

  // Git commit if any files updated
  if (updatedCount > 0 && !DRY_RUN) {
    log('\nCommitting changes...');
    const msg = `data: update ${updatedCompanies.map((c) => c.ticker).join(', ')}`;
    try {
      execSync('git add src/data/', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      execSync(`git commit -m "${msg}"`, { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      log(`git: committed — "${msg}"`);
    } catch (e) {
      log(`git: commit failed — ${e.message}`);
    }
  }

  log(`\nDone. ${updatedCount} file(s) updated.`);
}

main().catch((e) => {
  log(`Fatal error: ${e.message}`);
  process.exit(1);
});

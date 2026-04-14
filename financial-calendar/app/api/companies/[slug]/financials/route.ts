import { NextRequest, NextResponse } from 'next/server';
import { getCompany } from '@/lib/constants/companies';
import { readFinancials } from '@/lib/data/reader';
import { ApiSuccess, ApiError } from '@/types/api';
import { FinancialPeriodRecord } from '@/types/financials';

export const revalidate = 21600;

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const company = getCompany(params.slug);
  if (!company) {
    return NextResponse.json(
      { ok: false, error: 'Company not found', code: 404 } satisfies ApiError,
      { status: 404 }
    );
  }
  const periodType = req.nextUrl.searchParams.get('periodType') ?? undefined;
  const records = await readFinancials(params.slug, periodType);
  return NextResponse.json({
    ok: true,
    data: records,
  } satisfies ApiSuccess<FinancialPeriodRecord[]>);
}

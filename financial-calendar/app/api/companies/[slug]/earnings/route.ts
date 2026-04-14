import { NextRequest, NextResponse } from 'next/server';
import { getCompany } from '@/lib/constants/companies';
import { readEarnings } from '@/lib/data/reader';
import { ApiSuccess, ApiError } from '@/types/api';
import { EarningsEvent } from '@/types/calendar';

export const revalidate = 21600;

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const company = getCompany(params.slug);
  if (!company) {
    return NextResponse.json(
      { ok: false, error: 'Company not found', code: 404 } satisfies ApiError,
      { status: 404 }
    );
  }
  const events = await readEarnings(params.slug);
  return NextResponse.json({ ok: true, data: events } satisfies ApiSuccess<EarningsEvent[]>);
}

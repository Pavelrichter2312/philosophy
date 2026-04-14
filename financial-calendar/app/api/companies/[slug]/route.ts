import { NextRequest, NextResponse } from 'next/server';
import { getCompany } from '@/lib/constants/companies';
import { ApiSuccess, ApiError } from '@/types/api';
import { Company } from '@/types/company';

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
  return NextResponse.json({ ok: true, data: company } satisfies ApiSuccess<Company>);
}

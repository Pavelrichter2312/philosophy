import { NextResponse } from 'next/server';
import { readAllCompanies } from '@/lib/data/reader';
import { ApiSuccess } from '@/types/api';
import { Company } from '@/types/company';

export const revalidate = 21600; // 6 hours

export async function GET() {
  const companies = await readAllCompanies();
  return NextResponse.json({ ok: true, data: companies } satisfies ApiSuccess<Company[]>);
}

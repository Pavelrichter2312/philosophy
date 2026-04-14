import { NextRequest, NextResponse } from 'next/server';
import { readAllEarnings } from '@/lib/data/reader';
import { ApiSuccess } from '@/types/api';
import { EarningsEvent } from '@/types/calendar';

export const revalidate = 21600;

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get('year');
  const month = req.nextUrl.searchParams.get('month');

  let events = await readAllEarnings();

  if (year) {
    events = events.filter((e) => e.announcedDate.startsWith(year));
  }
  if (month) {
    events = events.filter((e) => e.announcedDate.startsWith(`${year ?? ''}`).toString() && e.announcedDate.slice(5, 7) === month.padStart(2, '0'));
  }

  return NextResponse.json({ ok: true, data: events } satisfies ApiSuccess<EarningsEvent[]>);
}

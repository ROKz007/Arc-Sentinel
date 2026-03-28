export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.toString();
    const url = `${BACKEND}/anomalies${search ? `?${search}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

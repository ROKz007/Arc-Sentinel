export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  let backendStatus = 'unreachable';
  try {
    const res = await fetch(`${backendUrl}/`);
    backendStatus = res.ok ? 'connected' : `error_${res.status}`;
  } catch (e) {
    backendStatus = `fetch_error: ${(e as Error).message}`;
  }

  return NextResponse.json({
    frontend: 'ok',
    backend_url: backendUrl ?? 'NOT SET',
    backend_status: backendStatus,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

export async function GET(request: NextRequest) {
  const response = await fetch(`${getBackendUrl()}/schoolbase-admin/api/operations/status`, {
    headers: { cookie: request.headers.get('cookie') || '' },
    cache: 'no-store',
  });
  return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
}
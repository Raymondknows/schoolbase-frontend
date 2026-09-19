import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const response = await fetch(`${getBackendUrl()}/schoolbase-admin/api/operations/database-export`, {
    headers: { cookie: request.headers.get('cookie') || '' },
    cache: 'no-store',
  });
  return new NextResponse(await response.arrayBuffer(), {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json',
      'content-disposition': response.headers.get('content-disposition') || '',
      'cache-control': 'no-store',
    },
  });
}
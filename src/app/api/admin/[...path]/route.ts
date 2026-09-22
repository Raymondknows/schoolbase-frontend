import { NextRequest, NextResponse } from 'next/server';
import { getStaffSession } from '@/lib/auth';
import { buildApiUrl } from '@/lib/api-client';

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path } = await context.params;
    const backendUrl = buildApiUrl(`/admin/${path.join('/')}${request.nextUrl.search}`);
    const headers = new Headers();
    const cookie = request.headers.get('cookie');
    const contentType = request.headers.get('content-type');

    if (cookie) headers.set('cookie', cookie);
    if (contentType) headers.set('content-type', contentType);

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
    });

    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
    });
  } catch (error) {
    console.error('[admin proxy] Failed to forward request:', error);
    return NextResponse.json({ error: 'Failed to forward admin request' }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
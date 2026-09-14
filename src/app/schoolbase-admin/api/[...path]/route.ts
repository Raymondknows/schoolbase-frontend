import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api-client';

async function forwardRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    const backendUrl = buildApiUrl(
      `/schoolbase-admin/api/${path.join('/')}${request.nextUrl.search}`,
    );
    const headers = new Headers();

    request.headers.forEach((value, key) => {
      if (key === 'host' || key === 'content-length') return;
      headers.set(key, value);
    });

    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: 'manual',
    };

    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const body = await request.arrayBuffer();
      if (body.byteLength > 0) init.body = body;
    }

    const response = await fetch(backendUrl, init);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('transfer-encoding');
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('connection');

    return new NextResponse(await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[schoolbase-admin proxy] Failed to forward request:', error);
    return NextResponse.json(
      { error: 'Failed to forward schoolbase-admin request' },
      { status: 502 },
    );
  }
}

export const GET = forwardRequest;
export const POST = forwardRequest;
export const PUT = forwardRequest;
export const PATCH = forwardRequest;
export const DELETE = forwardRequest;
export const OPTIONS = forwardRequest;

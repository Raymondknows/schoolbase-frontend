import { NextRequest, NextResponse } from 'next/server';
import { getStaffSession } from '@/lib/auth';
import { buildApiUrl } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = `${buildApiUrl('/admin/students/import')}${request.nextUrl.search}`;
    const headers: Record<string, string> = {
      cookie: request.headers.get('cookie') || '',
      authorization: request.headers.get('authorization') || '',
    };

    const xSchool = request.headers.get('x-school-id');
    if (xSchool) headers['x-school-id'] = xSchool;

    const incomingContentType = request.headers.get('content-type') || '';
    if (incomingContentType) headers['content-type'] = incomingContentType;

    const bodyBuffer = await request.arrayBuffer();
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers,
      body: bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
    };

    const resp = await fetch(backendUrl, fetchOptions);
    const contentType = resp.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    }

    const text = await resp.text().catch(() => '');
    return new NextResponse(text, { status: resp.status, headers: { 'content-type': contentType || 'text/plain' } });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({
      error: 'Failed to import students',
      details: error instanceof Error ? error.message : 'Unknown proxy error',
    }, { status: 500 });
  }
}

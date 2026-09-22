import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api-client';

async function proxyVerify(request: NextRequest, method: string) {
  try {
    const backendUrl = buildApiUrl('/admin/verify');
    const body = method === 'GET' ? undefined : await request.text();

    const resp = await fetch(backendUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('cookie') && {
          cookie: request.headers.get('cookie') || '',
        }),
      },
      ...(body && { body }),
    });

    const text = await resp.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { text };
    }

    return NextResponse.json(data, { status: resp.status });
  } catch (err) {
    console.error('Proxy /api/admin/verify error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return proxyVerify(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyVerify(request, 'POST');
}

import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

async function proxySubjectRequest(request: NextRequest, method: string, body?: string) {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/admin/subjects`, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('cookie') && {
          cookie: request.headers.get('cookie') || '',
        }),
      },
      ...(method !== 'GET' && {
        body: body || '{}',
      }),
    });

    const rawText = await response.text();
    let data: unknown = rawText ? JSON.parse(rawText) : {};

    if (!response.ok) {
      return NextResponse.json(
        typeof data === 'object' && data !== null ? data : { error: rawText || `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(typeof data === 'object' && data !== null ? data : { value: data });
  } catch (error: any) {
    console.error('Error proxying subjects request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process subjects request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxySubjectRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxySubjectRequest(request, 'POST', body || '{}');
}

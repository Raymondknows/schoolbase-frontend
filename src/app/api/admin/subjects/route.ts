import { NextRequest, NextResponse } from 'next/server';
import { getStaffSession } from '@/lib/auth';
import { getBackendUrl } from '@/lib/backend-url';

async function proxySubjectRequest(request: NextRequest, method: string, body?: string) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    let data: unknown = {};
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { error: 'The subjects service returned an invalid response' };
      }
    }

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

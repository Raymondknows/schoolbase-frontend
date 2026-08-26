import { getStaffSession } from '@/lib/auth';
import { buildApiUrl } from '@/lib/api-client';
import { NextRequest, NextResponse } from 'next/server';

async function forward(request: NextRequest) {
  try {
    const session = await getStaffSession();
    const schoolId = session?.schoolId || '';
    if (!schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const backendUrl = buildApiUrl(`/admin/timetable${url.search}`);
    const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();
    const response = await fetch(backendUrl, {
      method: request.method,
      body,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        cookie: request.headers.get('cookie') || '',
        'x-school-id': schoolId,
      },
    });

    const payload = await response.json().catch(() => ({ error: `Backend error: ${response.status}` }));
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error('Error forwarding timetable request:', error);
    return NextResponse.json({ error: 'Failed to fetch timetable.' }, { status: 500 });
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;

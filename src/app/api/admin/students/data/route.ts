import { getCurrentSchoolId } from '@/lib/school';
import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const forwardedParams = new URLSearchParams();
    const requestedSchoolId = params.get('schoolId');
    const schoolId = requestedSchoolId || await getCurrentSchoolId();
    if (schoolId) forwardedParams.set('schoolId', schoolId);
    const status = params.get('status');
    if (status) forwardedParams.set('status', status);
    const query = forwardedParams.toString();
    const backendUrl = buildApiUrl(`/admin/students/data${query ? `?${query}` : ''}`);

    const resp = await fetch(backendUrl, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!resp.ok) {
      const errorBody = await resp.json().catch(() => null);
      // Forward subscription error information if present
      if (resp.status === 403 && errorBody?.code === 'SUBSCRIPTION_INACTIVE') {
        return NextResponse.json(errorBody, { status: resp.status });
      }
      return NextResponse.json(
        errorBody || { error: `Backend error: ${resp.status}` },
        { status: resp.status }
      );
    }

    const body = await resp.json();
    return NextResponse.json(body, { status: resp.status });
  } catch (error) {
    console.error('Error fetching students data:', error);
    return NextResponse.json({ error: 'Failed to fetch students data' }, { status: 500 });
  }
}

import { getStaffSession } from '@/lib/auth';
import { buildApiUrl } from '@/lib/api-client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const response = await fetch(buildApiUrl('/bells/active'), {
      headers: {
        cookie: request.headers.get('cookie') || '',
        'x-school-id': session.schoolId,
      },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({ error: `Backend error: ${response.status}` }));
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error('Error fetching active bell schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch active bell schedule.' }, { status: 500 });
  }
}

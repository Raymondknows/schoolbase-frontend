import { cookies } from 'next/headers';
import { getStaffSession } from '@/lib/auth';
import { buildApiUrl } from '@/lib/api-client';

export async function GET() {
  try {
    const session = await getStaffSession();
    if (!session) {
      console.error('[api/admin/school] No token found');
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const schoolId = session.schoolId;
    if (!schoolId) {
      console.error('[api/admin/school] Session has no schoolId');
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const cookieStore = await cookies();

    console.log('[api/admin/school] Fetching school for ID:', schoolId);
    // Fetch school data from backend
    const url = buildApiUrl(`/admin/school/${schoolId}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieStore.get('schoolbase_session')?.value ? `schoolbase_session=${cookieStore.get('schoolbase_session')?.value}` : '',
      },
    });

    console.log('[api/admin/school] Response status:', response.status);

    const data = await response.json();
    console.log('[api/admin/school] Response data:', JSON.stringify(data).substring(0, 200));

    if (!response.ok) {
      console.error('[api/admin/school] Backend returned error:', data);
      return Response.json(data || { error: 'School not found' }, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error('[api/admin/school] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

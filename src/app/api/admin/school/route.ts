import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3006';

function secret() {
  const value = process.env.SESSION_SECRET?.trim();
  if (!value) {
    throw new Error('SESSION_SECRET is not configured for this frontend deployment');
  }
  return new TextEncoder().encode(value);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('schoolbase_session')?.value;

    if (!sessionToken) {
      console.error('[api/admin/school] No token found');
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify token to extract schoolId
    let schoolId: string;
    try {
      const { payload } = await jwtVerify(sessionToken, secret());
      
      if (!payload || typeof payload !== 'object' || !('schoolId' in payload)) {
        console.error('[api/admin/school] Invalid token payload');
        return Response.json({ error: 'Invalid token' }, { status: 401 });
      }

      schoolId = (payload as any).schoolId;
    } catch (err) {
      console.error('[api/admin/school] Token verification failed:', err);
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('[api/admin/school] Fetching school for ID:', schoolId);
    console.log('[api/admin/school] Backend URL:', BACKEND_URL);

    // Fetch school data from backend
    const url = `${BACKEND_URL}/api/admin/school/${schoolId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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

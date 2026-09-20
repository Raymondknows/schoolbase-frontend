import { buildApiUrl } from '@/lib/api-client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;

    if (!schoolId) {
      return Response.json({ error: 'School ID is required' }, { status: 400 });
    }

    console.log('[api/admin/school/:schoolId] Fetching school:', schoolId);
    // Fetch school data from backend
    const url = buildApiUrl(`/admin/school/${schoolId}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
    });

    console.log('[api/admin/school/:schoolId] Response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('[api/admin/school/:schoolId] Backend error:', text);
      return Response.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('[api/admin/school/:schoolId] Error:', error);
    return Response.json(
      { error: 'Failed to fetch school data' },
      { status: 500 }
    );
  }
}

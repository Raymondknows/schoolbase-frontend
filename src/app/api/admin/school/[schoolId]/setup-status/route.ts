import { buildApiUrl } from '@/lib/api-client';
import { getStaffSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;

    if (!schoolId) {
      return Response.json({ error: 'School ID is required' }, { status: 400 });
    }

    const session = await getStaffSession();
    if (!session || (session.role !== 'PLATFORM_ADMIN' && (!session.schoolId || session.schoolId !== schoolId))) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = buildApiUrl(`/admin/school/${schoolId}/setup-status`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const text = await response.text();
    try {
      return Response.json(text ? JSON.parse(text) : {});
    } catch {
      return Response.json({ error: 'The setup-status service returned an invalid response' }, { status: 502 });
    }
  } catch (error) {
    console.error('[api/admin/school/:schoolId/setup-status] Error:', error);
    return Response.json(
      { error: 'Failed to fetch setup status' },
      { status: 500 }
    );
  }
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3006';
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

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('[api/admin/school/:schoolId/setup-status] Error:', error);
    return Response.json(
      { error: 'Failed to fetch setup status' },
      { status: 500 }
    );
  }
}

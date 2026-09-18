import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = buildApiUrl('/admin/students/send-access-notifications');
    const headers = new Headers({
      'content-type': request.headers.get('content-type') || 'application/json',
    });

    for (const headerName of ['cookie', 'authorization', 'x-school-id']) {
      const value = request.headers.get(headerName);
      if (value) headers.set(headerName, value);
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: await request.arrayBuffer(),
    });

    const responseBody = await response.arrayBuffer();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('[student access notification proxy] Failed to forward request:', error);
    return NextResponse.json(
      { error: 'The notification service is temporarily unavailable. Please try again.' },
      { status: 503 },
    );
  }
}

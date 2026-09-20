import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

/**
 * Proxy handler for /api/uploads/* paths
 * Forwards requests to backend or serves from local storage as fallback
 * This mirrors the functionality of src/app/uploads/[...path]/route.ts
 * but handles /api/uploads/ prefix instead of just /uploads/
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Remove 'api' and 'uploads' from the path
    // URL: /api/uploads/photos/1780686933450-ex46cs.jpg
    // pathParts: ['api', 'uploads', 'photos', '1780686933450-ex46cs.jpg']
    // uploadPath: /photos/1780686933450-ex46cs.jpg
    const uploadPathParts = pathParts.slice(2);
    if (uploadPathParts.length === 0) {
      return NextResponse.json(
        { error: 'Upload path required' },
        { status: 400 }
      );
    }

    const uploadPath = '/' + uploadPathParts.join('/');

    // Build backend URL
    // Backend serves from /uploads/... (not /api/uploads/...)
    // So /api/uploads/photos/x.jpg should proxy to /uploads/photos/x.jpg
    const backendUrl = getBackendUrl();
    const fullBackendUrl = `${backendUrl}/uploads${uploadPath}`;

    try {
      // Proxy to backend static file server
      const resp = await fetch(fullBackendUrl, {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
        redirect: 'follow',
      });

      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        const contentType = resp.headers.get('content-type') || 'application/octet-stream';

        return new NextResponse(buffer, {
          status: resp.status,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      // If backend returns 404 or other error, fall through to error response
      console.warn(`[UPLOADS API] Backend returned ${resp.status} for ${fullBackendUrl}`);
      return NextResponse.json(
        { error: `Backend returned ${resp.status}` },
        { status: resp.status }
      );
    } catch (err) {
      console.error('[UPLOADS API] Backend fetch failed:', err);
      return NextResponse.json(
        { error: 'Failed to fetch from backend' },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('[UPLOADS API] Error:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

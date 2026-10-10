import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api-client';

const SESSION_COOKIE_NAME = 'schoolbase_session';
const LEGACY_SESSION_COOKIE_NAMES = ['schoolbase_staff', 'schoolbase_parent'];

function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    ...(isProduction ? { domain: '.schoolbase.live' } : {}),
  } as const;
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const backendUrl = buildApiUrl('/admin/impersonate');

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: body || '{}',
    });

    const data = await response.json().catch(async () => {
      const text = await response.text();
      return { error: text };
    });

    const json = NextResponse.json(data, { status: response.status });

    if (response.ok && data?.token) {
      const cookieOptions = getSessionCookieOptions();

      // Clear any stale session cookies first so the browser does not keep conflicting copies.
      json.cookies.set(SESSION_COOKIE_NAME, '', {
        ...cookieOptions,
        maxAge: 0,
      });
      for (const legacyCookieName of LEGACY_SESSION_COOKIE_NAMES) {
        json.cookies.set(legacyCookieName, '', {
          ...cookieOptions,
          maxAge: 0,
        });
      }

      json.cookies.set(SESSION_COOKIE_NAME, data.token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return json;
  } catch (error) {
    console.error('Proxy /api/admin/impersonate error:', error);
    return NextResponse.json({ error: 'Failed to exchange impersonation token.' }, { status: 500 });
  }
}

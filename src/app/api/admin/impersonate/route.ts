import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api-client';

const SESSION_COOKIE_NAME = 'schoolbase_session';
const LEGACY_SESSION_COOKIE_NAMES = ['schoolbase_staff', 'schoolbase_parent'];

function serializeSessionCookie(name: string, value: string, includeDomain: boolean, maxAge: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    `SameSite=${isProduction ? 'None' : 'Lax'}`,
  ];

  if (isProduction) attributes.push('Secure');
  if (isProduction && includeDomain) attributes.push('Domain=.schoolbase.live');
  if (maxAge === 0) attributes.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');

  return attributes.join('; ');
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
      for (const cookieName of [SESSION_COOKIE_NAME, ...LEGACY_SESSION_COOKIE_NAMES]) {
        json.headers.append('Set-Cookie', serializeSessionCookie(cookieName, '', false, 0));
        json.headers.append('Set-Cookie', serializeSessionCookie(cookieName, '', true, 0));
      }
      json.headers.append(
        'Set-Cookie',
        serializeSessionCookie(SESSION_COOKIE_NAME, data.token, true, 7 * 24 * 60 * 60),
      );
    }

    return json;
  } catch (error) {
    console.error('Proxy /api/admin/impersonate error:', error);
    return NextResponse.json({ error: 'Failed to exchange impersonation token.' }, { status: 500 });
  }
}

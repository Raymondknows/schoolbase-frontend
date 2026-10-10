import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api-client';

const SESSION_COOKIE_NAME = 'schoolbase_session';
const LEGACY_SESSION_COOKIE_NAMES = ['schoolbase_staff', 'schoolbase_parent'];

function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    path: '/',
    ...(isProduction ? { domain: '.schoolbase.live' } : {}),
  };
}

function expireHostCookie(name: string, isProduction: boolean) {
  return [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
    `SameSite=${isProduction ? 'None' : 'Lax'}`,
    ...(isProduction ? ['Secure'] : []),
  ].join('; ');
}

function setHostSessionCookie(token: string, isProduction: boolean) {
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${7 * 24 * 60 * 60}`,
    'HttpOnly',
    `SameSite=${isProduction ? 'None' : 'Lax'}`,
    ...(isProduction ? ['Secure'] : []),
  ].join('; ');
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
      const isProduction = process.env.NODE_ENV === 'production';
      json.cookies.set(SESSION_COOKIE_NAME, data.token, {
        ...getSessionCookieOptions(),
        maxAge: 7 * 24 * 60 * 60,
      });
      for (const cookieName of [SESSION_COOKIE_NAME, ...LEGACY_SESSION_COOKIE_NAMES]) {
        json.headers.append('Set-Cookie', expireHostCookie(cookieName, isProduction));
      }
      json.headers.append('Set-Cookie', setHostSessionCookie(data.token, isProduction));
    }

    return json;
  } catch (error) {
    console.error('Proxy /api/admin/impersonate error:', error);
    return NextResponse.json({ error: 'Failed to exchange impersonation token.' }, { status: 500 });
  }
}

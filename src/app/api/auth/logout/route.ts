import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAMES = ['schoolbase_session', 'schoolbase_staff', 'schoolbase_parent', 'staff_session'];

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

export async function POST(request: Request) {
  const url = new URL(request.url);
  const requestedRedirect = url.searchParams.get('redirectUrl') || '/login';
  const redirectUrl = requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')
    ? requestedRedirect
    : '/login';
  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.redirect(new URL(redirectUrl, request.url), {
    status: 302,
  });

  response.cookies.set('schoolbase_session', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    ...(isProduction ? { domain: '.schoolbase.live' } : {}),
    maxAge: 0,
  });

  for (const cookieName of SESSION_COOKIE_NAMES) {
    response.headers.append('Set-Cookie', expireHostCookie(cookieName, isProduction));
  }

  return response;
}

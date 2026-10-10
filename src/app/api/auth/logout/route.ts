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
  const isProduction = process.env.NODE_ENV === 'production';
  const publicOrigin = isProduction ? 'https://www.schoolbase.live' : url.origin;
  const requestedRedirect = url.searchParams.get('redirectUrl') || '/login';
  let redirectTarget = new URL('/login', publicOrigin);

  try {
    const candidate = new URL(requestedRedirect, publicOrigin);
    if (candidate.origin === publicOrigin && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')) {
      redirectTarget = candidate;
    }
  } catch {
    // Keep the safe login destination.
  }

  const response = NextResponse.redirect(redirectTarget, {
    status: 302,
  });

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    path: '/',
    ...(isProduction ? { domain: '.schoolbase.live' } : {}),
  };

  for (const cookieName of SESSION_COOKIE_NAMES) {
    response.headers.append('Set-Cookie', expireHostCookie(cookieName, isProduction));
    response.cookies.set(cookieName, '', { ...cookieOptions, maxAge: 0 });
  }

  return response;
}

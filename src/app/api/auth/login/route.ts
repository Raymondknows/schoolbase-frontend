import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function getBackendUrl() {
  // Keep local development isolated from production values that may be present
  // in the shared .env file.
  if (process.env.NODE_ENV !== 'production') {
    return process.env.BACKEND_URL || 'http://localhost:3006';
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  }

  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  }

  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://api.schoolbase.live';
  }

  return 'http://localhost:3006';
}

function secret() {
  const value = process.env.SESSION_SECRET?.trim();
  if (!value) {
    throw new Error('SESSION_SECRET is not configured for this frontend deployment');
  }
  return new TextEncoder().encode(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const BACKEND_URL = getBackendUrl();
    const host = request.headers.get('host') || '';
    const isSchoolbaseHost = host.includes('schoolbase.live') || host.includes('vercel.app');
    const isLocalHost = host.includes('localhost') || host.includes('127.0.0.1');
    const isSecureCookie = !isLocalHost;

    console.log('=== LOGIN API ROUTE ===');
    console.log('Backend URL:', BACKEND_URL);
    console.log('Request host:', host, { isSchoolbaseHost, isLocalHost, isSecureCookie });

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    let data: any = {};

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = {
          error: 'Authentication service returned an unexpected response.',
          backendError: rawText.slice(0, 300),
        };
      }
    }

    if (!response.ok) {
      console.error('Backend error:', { status: response.status, data });
      return NextResponse.json(data, { status: response.status });
    }

    let session = data?.session ?? data?.user ?? null;
    if (data?.token) {
      const frontendSessionSecret = process.env.SESSION_SECRET?.trim();
      if (frontendSessionSecret) {
        try {
          const decoded = await jwtVerify(data.token, secret());
          session = decoded.payload;
        } catch (e) {
          console.warn('Token decode warning: frontend secret mismatch or token invalid; continuing with upstream payload.', e);
        }
      }
    }

    const res = NextResponse.json({
      success: true,
      session,
      token: data.token,
      user: data.user ?? null,
    });

    if (data?.token) {
      res.cookies.set('schoolbase_session', data.token, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: isSecureCookie ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
        ...(isSchoolbaseHost ? { domain: '.schoolbase.live' } : {}),
      });
    }

    return res;
  } catch (error) {
    const BACKEND_URL = getBackendUrl();
    console.error('=== LOGIN ERROR ===');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    console.error('Backend URL:', BACKEND_URL);
    return NextResponse.json({
      error: 'Login failed',
      debug: {
        backendUrl: BACKEND_URL,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    }, { status: 500 });
  }
}

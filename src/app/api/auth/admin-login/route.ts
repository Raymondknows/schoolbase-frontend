import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getBackendUrl } from '@/lib/backend-url';

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

    console.log('=== ADMIN LOGIN API ROUTE (DEPRECATED - use /api/auth/school-login) ===');

    // Proxy to new backend endpoint
    const response = await fetch(`${BACKEND_URL}/api/auth/school-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Decode token to get session data
    let session = null;
    if (data.token) {
      try {
        const decoded = await jwtVerify(data.token, secret());
        session = decoded.payload;
      } catch (e) {
        console.error('Token decode error:', e);
      }
    }

    // Extract token and set as httpOnly cookie
    const res = NextResponse.json({
      success: true,
      session,
      token: data.token,
    });
    
    if (data.token) {
      res.cookies.set('schoolbase_session', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
        ...(process.env.NODE_ENV === 'production' ? { domain: '.schoolbase.live' } : {}),
      });
    }

    return res;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
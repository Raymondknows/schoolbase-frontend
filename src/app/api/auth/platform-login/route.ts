import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function getBackendUrl() {
  if (process.env.NODE_ENV !== 'production') {
    return process.env.BACKEND_URL || 'http://localhost:3006';
  }

  return (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.schoolbase.live')
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');
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
    
    console.log('=== PLATFORM LOGIN API ROUTE ===');
    
    // Proxy to backend auth/platform-login
    const response = await fetch(`${BACKEND_URL}/api/auth/platform-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    let data: any = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { error: 'Authentication service returned an unexpected response.' };
    }

    if (!response.ok) {
      console.error('Platform login failed:', { status: response.status, data });
      return NextResponse.json(data, { status: response.status });
    }

    // Decode the token when possible, then preserve the backend identity fields
    // even if frontend/backend secrets are temporarily out of sync.
    let session = data?.session ?? null;
    if (data.token) {
      try {
        const decoded = await jwtVerify(data.token, secret());
        session = decoded.payload;
        console.log('Platform admin login successful:', { role: session?.role, userId: session?.userId });
      } catch (e) {
        console.warn('Token decode warning; using backend login identity:', e);
      }
    }

    if (!session && data?.role) {
      session = {
        userId: data.userId,
        role: data.role,
        email: data.email,
        name: data.name,
        schoolId: data.schoolId ?? null,
      };
    }

    // Set httpOnly session cookie
    const res = NextResponse.json({
      success: true,
      session,
      token: data.token,
      role: data.role ?? session?.role ?? null,
      userId: data.userId ?? session?.userId ?? null,
      email: data.email ?? session?.email ?? null,
      name: data.name ?? session?.name ?? null,
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

    console.log('=== PLATFORM LOGIN SUCCESS ===');
    return res;
  } catch (error) {
    console.error('=== PLATFORM LOGIN ERROR ===', error);
    return NextResponse.json({ 
      error: 'Login failed',
      debug: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

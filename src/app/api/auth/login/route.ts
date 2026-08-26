import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function getBackendUrl() {
  // For production (Vercel), use api.schoolbase.live
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.schoolbase.live';
  }
  // For development, use localhost
  return process.env.BACKEND_URL || 'http://localhost:3006';
}

function secret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? 'schoolbase-dev-secret-change-me',
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const BACKEND_URL = getBackendUrl();
    
    console.log('=== LOGIN API ROUTE ===');
    
    // Canonical login proxy route for the frontend login page.
    // Keep this aligned with the backend alias /api/auth/login so the live API matches the local flow.
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Allow backend to set cookies
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend error:', { status: response.status, data });
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
    const BACKEND_URL = getBackendUrl();
    console.error('=== LOGIN ERROR ===');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    console.error('Backend URL:', BACKEND_URL);
    return NextResponse.json({ 
      error: 'Login failed',
      debug: {
        backendUrl: BACKEND_URL,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 });
  }
}

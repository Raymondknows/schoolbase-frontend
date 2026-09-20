import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

/**
 * POST /api/signup/verify-otp
 * Verify OTP and create school account
 * Body: { schoolName, slug, country, adminName, adminEmail, password, otp }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const BACKEND_URL = getBackendUrl();
    
    console.log('=== SIGNUP VERIFY OTP ===');
    console.log('School:', body.schoolName);
    console.log('Email:', body.adminEmail);
    
    // Call backend verify-otp endpoint
    const response = await fetch(`${BACKEND_URL}/api/trial/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend error:', { status: response.status, data });
      return NextResponse.json(data, { status: response.status });
    }

    // Set session cookie with the returned token
    const res = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      school: data.school,
      user: data.user
    });
    
    if (data.token) {
      res.cookies.set('schoolbase_staff', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    }

    console.log('=== ACCOUNT CREATED ===');
    return res;
  } catch (error) {
    console.error('=== SIGNUP VERIFICATION ERROR ===');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      error: 'Failed to verify and create account',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

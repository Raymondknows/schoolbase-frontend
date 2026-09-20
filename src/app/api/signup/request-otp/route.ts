import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

/**
 * POST /api/signup/request-otp
 * Request OTP for school signup
 * Body: { schoolName, slug, country, adminName, adminEmail, password }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const BACKEND_URL = getBackendUrl();
    
    console.log('=== SIGNUP REQUEST OTP ===');
    console.log('School:', body.schoolName);
    console.log('Email:', body.adminEmail);
    
    // Call backend OTP endpoint
    const response = await fetch(`${BACKEND_URL}/api/trial/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend error:', { status: response.status, data });
      return NextResponse.json(data, { status: response.status });
    }

    console.log('=== OTP SENT ===');
    return NextResponse.json(data);
  } catch (error) {
    console.error('=== SIGNUP REQUEST ERROR ===');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      error: 'Failed to request OTP',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

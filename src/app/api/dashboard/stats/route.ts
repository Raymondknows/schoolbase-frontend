import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    // Get the staff token from cookies
    const staffToken = request.cookies.get('schoolbase_session')?.value || request.cookies.get('schoolbase_staff')?.value;
    
    if (!staffToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Fetch dashboard data from backend
    const response = await fetch(buildApiUrl('/admin/dashboard'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${staffToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Dashboard fetch failed:', response.status, await response.text());
      return NextResponse.json(
        { error: 'Failed to load dashboard data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}

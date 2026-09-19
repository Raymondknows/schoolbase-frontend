import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function secret() {
  const value = process.env.SESSION_SECRET?.trim();
  if (!value) {
    throw new Error('SESSION_SECRET is not configured for this frontend deployment');
  }
  return new TextEncoder().encode(value);
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('schoolbase_session')?.value;

    if (!token) {
      return NextResponse.json({ session: null, user: null }, { status: 200 });
    }

    const { payload } = await jwtVerify(token, secret());
    const user = payload as Record<string, unknown> | null;
    return NextResponse.json({ session: user, user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ session: null, user: null }, { status: 200 });
  }
}

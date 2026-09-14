import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function secret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? 'schoolbase-dev-secret-change-me',
  );
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

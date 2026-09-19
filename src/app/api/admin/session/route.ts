import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

function secret() {
  const value = process.env.SESSION_SECRET?.trim();
  if (!value) {
    throw new Error('SESSION_SECRET is not configured for this frontend deployment');
  }
  return new TextEncoder().encode(value);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('schoolbase_session')?.value;

    if (!sessionToken) {
      return Response.json({ session: null });
    }

    try {
      const { payload } = await jwtVerify(sessionToken, secret());
      return Response.json({ session: payload });
    } catch {
      return Response.json({ session: null });
    }
  } catch (error) {
    console.error('Error fetching session:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

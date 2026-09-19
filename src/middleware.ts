import { jwtVerify, SignJWT } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Unified session cookie for all user types (staff, teachers, parents, admins)
const SESSION_COOKIE = "schoolbase_session";

function secret() {
  const key = process.env.SESSION_SECRET?.trim();
  if (!key) {
    throw new Error("SESSION_SECRET is not configured for this frontend deployment");
  }
  return new TextEncoder().encode(key);
}

async function readValidToken(cookie?: string) {
  if (!cookie) return null;
  try {
    const result = await jwtVerify(cookie, secret());
    if (result.payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (result.payload.exp < now) {
        return null;
      }
    }
    return result.payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for unified session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const tokenPayload = sessionCookie ? await readValidToken(sessionCookie) : null;
  const isValidToken = Boolean(tokenPayload);

  // Protect platform admin routes
  if (pathname.startsWith("/schoolbase-admin")) {
    if (!isValidToken) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
  }

  // Protect school admin routes
  if (pathname.startsWith("/admin")) {
    if (!isValidToken) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      const response = NextResponse.redirect(login);
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    if (tokenPayload?.role === "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/schoolbase-admin", request.url));
    }
  }

  if (pathname.startsWith("/teacher")) {
    if (!isValidToken) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      const response = NextResponse.redirect(login);
      // Clear the invalid cookie
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
  }

  if (
    pathname.startsWith("/parent") &&
    !pathname.startsWith("/parent/login")
  ) {
    const parentToken = request.cookies.get(SESSION_COOKIE)?.value;
    if (!parentToken || !(await readValidToken(parentToken))) {
      return NextResponse.redirect(new URL("/parent/login", request.url));
    }
  }

  // Multi-tenant: detect subdomain and set a `schoolSlug` cookie for server-side resolution.
  try {
    const hostname = request.nextUrl.hostname; // e.g. school1.example.com
    if (hostname && !hostname.startsWith("localhost") && hostname.includes(".")) {
      const parts = hostname.split(".");
      if (parts.length >= 3) {
        const subdomain = parts[0];
        const current = request.cookies.get("schoolSlug")?.value;
        // Prefer a versioned, signed cookie to avoid accidental or malicious tampering.
        const newCookieName = "schoolSlug_v2";
        if (current !== subdomain) {
          // Sign the slug to prevent client-side tampering and set as an httpOnly cookie
          const token = await new SignJWT({ slug: subdomain })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(secret());

          const res = NextResponse.next();
          res.cookies.set(newCookieName, token, {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60,
          });
          return res;
        }
      }
    }
  } catch (e) {
    // best-effort; don't block requests
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/parent/:path*"],
};

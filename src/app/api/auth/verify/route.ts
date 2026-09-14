import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

async function proxyVerify(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const cookieHeader = request.headers.get("cookie");
    const method = request.method || "GET";

    const response = await fetch(`${backendUrl}/api/auth/verify`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
      credentials: "include",
      ...(method !== "GET" && method !== "HEAD" ? { body: await request.text() || "{}" } : {}),
    });

    const data = await response.json().catch(async () => {
      const text = await response.text();
      return { text };
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Verify endpoint error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyVerify(request);
}

export async function POST(request: NextRequest) {
  return proxyVerify(request);
}

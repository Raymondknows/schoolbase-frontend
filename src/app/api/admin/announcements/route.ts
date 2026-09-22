import { NextRequest, NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api-client";

async function forward(request: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const headers = new Headers();
    const cookie = request.headers.get("cookie");
    const contentType = request.headers.get("content-type");

    if (cookie) headers.set("cookie", cookie);
    if (contentType) headers.set("content-type", contentType);

    const response = await fetch(buildApiUrl(`/admin/announcements${request.nextUrl.search}`), {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    });

    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[announcements proxy] Failed to forward request:", error);
    return NextResponse.json(
      { error: "Failed to process announcement request" },
      { status: 502 },
    );
  }
}

export const GET = forward;
export const POST = forward;
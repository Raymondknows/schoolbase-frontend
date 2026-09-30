import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/lib/api-client";

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const backendUrl = buildApiUrl(`/support-chat/${path.join("/")}${request.nextUrl.search}`);
    const headers = new Headers();
    const cookie = request.headers.get("cookie");
    const contentType = request.headers.get("content-type");
    if (cookie) headers.set("cookie", cookie);
    if (contentType) headers.set("content-type", contentType);

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("connection");
    return new NextResponse(await response.arrayBuffer(), { status: response.status, headers: responseHeaders });
  } catch (error) {
    console.error("[support chat proxy] Failed to forward request:", error);
    return NextResponse.json({ error: "Unable to reach SchoolBase Support." }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;

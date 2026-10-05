import { NextRequest, NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api-client";

async function forwardRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "School administrator access required." }, { status: 403 });
    }

    if (request.method === "POST") {
      const origin = request.headers.get("origin");
      const fetchSite = request.headers.get("sec-fetch-site");
      if (origin !== request.nextUrl.origin || fetchSite === "cross-site") {
        return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
      }
    }

    const { path } = await context.params;
    const backendUrl = buildApiUrl(`/id-cards/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`);
    const headers = new Headers();
    const cookie = request.headers.get("cookie");
    const contentType = request.headers.get("content-type");

    if (cookie) headers.set("cookie", cookie);
    if (contentType) headers.set("content-type", contentType);

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    for (const name of ["content-type", "content-disposition", "cache-control"]) {
      const value = response.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    return new NextResponse(await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[id-card proxy] Failed to forward request:", error);
    return NextResponse.json({ error: "Unable to reach ID-card services." }, { status: 502 });
  }
}

export const GET = forwardRequest;
export const POST = forwardRequest;
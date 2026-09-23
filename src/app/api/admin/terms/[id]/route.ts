import { NextRequest, NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api-client";

async function forward(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const response = await fetch(buildApiUrl(`/admin/terms/${id}`), {
      method: request.method,
      headers: {
        cookie: request.headers.get("cookie") || "",
        "x-school-id": session.schoolId,
        ...(request.headers.get("content-type")
          ? { "content-type": request.headers.get("content-type") as string }
          : {}),
      },
      body: request.method === "DELETE" ? undefined : await request.arrayBuffer(),
    });

    const text = await response.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: "The terms service returned an invalid response" };
    }

    return NextResponse.json(
      typeof data === "object" && data !== null ? data : { error: String(data) },
      { status: response.status },
    );
  } catch (error) {
    console.error("[term proxy] Failed to forward request:", error);
    return NextResponse.json({ error: "Failed to process term request" }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return forward(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return forward(request, context);
}
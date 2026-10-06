import { NextRequest, NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api-client";

export async function GET(request: NextRequest, context: { params: Promise<{ pupilid: string }> }) {
  const session = await getStaffSession();
  if (!session?.schoolId || session.role !== "SCHOOL_ADMIN") {
    return NextResponse.json({ error: "School administrator access required." }, { status: 403 });
  }

  const { pupilid } = await context.params;
  const response = await fetch(buildApiUrl(`/id-cards/students/${encodeURIComponent(pupilid)}/photo`), {
    headers: { cookie: request.headers.get("cookie") || "" },
    cache: "no-store",
  });
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  if (!response.ok) {
    return NextResponse.json({ error: response.status === 404 ? "Student photo not found." : "Unable to load student photo." }, { status: response.status });
  }

  return new NextResponse(await response.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

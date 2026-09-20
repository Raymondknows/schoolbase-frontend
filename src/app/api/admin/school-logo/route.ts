import { NextResponse } from "next/server";
import { getStaffSession, getParentSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api-client";

export async function GET(request: Request) {
  try {
    const staffSession = await getStaffSession();
    const parentSession = await getParentSession();

    if (!staffSession && !parentSession) {
      return new Response("Unauthorized", { status: 401 });
    }

    const schoolId = (staffSession as any)?.schoolId || (parentSession as any)?.schoolId;
    if (!schoolId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const resp = await fetch(buildApiUrl(`/admin/school-logo/${schoolId}`), {
      headers: { cookie: request.headers.get("cookie") || "" },
      redirect: "follow",
    });

    if (!resp.ok) {
      return NextResponse.json({ error: "Not found" }, { status: resp.status });
    }

    const buffer = await resp.arrayBuffer();
    const mimeType = resp.headers.get("content-type") || "image/webp";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[SCHOOL LOGO] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

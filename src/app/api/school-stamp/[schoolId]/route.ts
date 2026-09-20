import { NextResponse } from "next/server";
import { buildApiUrl } from "@/lib/api-client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;
    // Proxy to backend admin route
    const resp = await fetch(buildApiUrl(`/admin/school-stamp/${schoolId}`), {
      headers: { cookie: request.headers.get("cookie") || "" },
      redirect: "follow",
    });

    if (!resp.ok) {
      return NextResponse.json({ error: "Not found" }, { status: resp.status });
    }

    const fileBuffer = await resp.arrayBuffer();
    const mimeType = resp.headers.get("content-type") || "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving stamp:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

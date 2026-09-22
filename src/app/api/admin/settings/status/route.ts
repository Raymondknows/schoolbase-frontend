import { NextRequest, NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api-client";

export async function GET(request: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get auth cookie to pass to backend
    const cookies = request.headers.get("cookie") || "";

    const response = await fetch(buildApiUrl("/admin/settings/status"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: cookies,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch settings status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Settings status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings status" },
      { status: 500 }
    );
  }
}

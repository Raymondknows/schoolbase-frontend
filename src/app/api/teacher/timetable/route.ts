import { getStaffSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api-client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const response = await fetch(
      buildApiUrl(`/teacher/timetable${url.search}`),
      {
        headers: {
          cookie: request.headers.get("cookie") || "",
          "x-school-id": session.schoolId,
        },
      },
    );
    const payload = await response
      .json()
      .catch(() => ({ error: `Backend error: ${response.status}` }));
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Error fetching teacher timetable:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable." },
      { status: 500 },
    );
  }
}

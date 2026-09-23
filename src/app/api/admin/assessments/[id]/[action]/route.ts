import { getStaffSession } from "@/lib/auth";

import { buildApiUrl } from "@/lib/api-client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, action } = await params;

    const response = await fetch(
      buildApiUrl(`/admin/assessments/${id}/${action}`),
      {
        method: "POST",
        headers: {
          "x-school-id": session.schoolId,
          cookie: req.headers.get('cookie') || '',
        },
      }
    );

    const responseText = await response.text();
    let data: unknown = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { error: "The assessment service returned an invalid response" };
    }

    if (!response.ok) {
      const error = typeof data === "object" && data !== null ? data : { error: String(data) };
      return Response.json(error, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Error performing assessment action:", error);
    return Response.json({ error: "Action failed" }, { status: 500 });
  }
}

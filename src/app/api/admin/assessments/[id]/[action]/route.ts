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

    if (!response.ok) {
      const error = await response.json();
      return Response.json(error, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error performing assessment action:", error);
    return Response.json({ error: "Action failed" }, { status: 500 });
  }
}

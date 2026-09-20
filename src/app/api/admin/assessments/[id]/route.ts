import { getStaffSession } from "@/lib/auth";

import { buildApiUrl } from "@/lib/api-client";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const response = await fetch(
      buildApiUrl(`/admin/assessments/${id}`),
      {
        method: "DELETE",
        headers: {
          "x-school-id": session.schoolId,
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
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
    console.error("Error deleting assessment:", error);
    return Response.json({ error: "Failed to delete assessment" }, { status: 500 });
  }
}

import { getStaffSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api-client";

export async function POST(req: Request) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const response = await fetch(buildApiUrl("/admin/assessments"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": session.schoolId,
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json(error, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating assessment:", error);
    return Response.json({ error: "Failed to create assessment" }, { status: 500 });
  }
}

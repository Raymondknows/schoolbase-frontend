import { getStaffSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api-client";

export async function POST(req: Request) {
  try {
    const session = await getStaffSession();
    if (!session?.schoolId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const response = await fetch(buildApiUrl(`/admin/results`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": session.schoolId,
        cookie: req.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    let data: unknown = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { error: "The results service returned an invalid response" };
    }

    if (!response.ok) {
      const error = typeof data === "object" && data !== null ? data : { error: String(data) };
      return Response.json(error, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Error saving results:", error);
    return Response.json({ error: "Failed to save results" }, { status: 500 });
  }
}

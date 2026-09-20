import { getStaffSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api-client";

export async function GET(req: Request) {
  try {
    const session = await getStaffSession();
    const schoolId = session?.schoolId || req.headers.get("x-school-id") || "";
    if (!schoolId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(buildApiUrl("/admin/academic-years"), {
      headers: {
        "x-school-id": schoolId,
        cookie: req.headers.get("cookie") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to fetch academic years" }));
      return Response.json(error, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return Response.json({ error: "Failed to fetch academic years" }, { status: 500 });
  }
}

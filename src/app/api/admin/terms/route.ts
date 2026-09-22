import { getStaffSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api-client";

async function proxyTerms(req: Request, method: "GET" | "POST") {
  try {
    const session = await getStaffSession();
    const schoolId = session?.schoolId || req.headers.get("x-school-id") || "";
    if (!schoolId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(buildApiUrl("/admin/terms"), {
      method,
      headers: {
        "x-school-id": schoolId,
        cookie: req.headers.get("cookie") || "",
        ...(method === "POST" ? { "content-type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: await req.text() } : {}),
    });

    const responseBody = await response.text();
    let data: unknown = {};
    if (responseBody) {
      try {
        data = JSON.parse(responseBody);
      } catch {
        data = { error: responseBody };
      }
    }
    if (!response.ok) {
      return Response.json(
        typeof data === "object" && data !== null ? data : { error: String(data) },
        { status: response.status },
      );
    }

    return Response.json(
      typeof data === "object" && data !== null ? data : { data },
    );
  } catch (error) {
    console.error("Error proxying terms:", error);
    return Response.json({ error: "Failed to process term request" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return proxyTerms(req, "GET");
}

export async function POST(req: Request) {
  return proxyTerms(req, "POST");
}

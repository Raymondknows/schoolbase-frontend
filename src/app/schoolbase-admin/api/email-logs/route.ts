import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const emailType = searchParams.get("emailType") || "";
    const campaignOnly = searchParams.get("campaignOnly") || "";

    const backendUrl = getBackendUrl();
    const url = new URL(`${backendUrl}/schoolbase-admin/api/email-logs`);
    url.searchParams.set("page", page);
    url.searchParams.set("limit", limit);
    if (emailType) {
      url.searchParams.set("emailType", emailType);
    }
    if (campaignOnly) {
      url.searchParams.set("campaignOnly", campaignOnly);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Cookie: request.headers.get("cookie") || "",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => ({ message: "Failed to parse response." }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying email logs request:", error);
    return NextResponse.json({ message: "Failed to proxy email logs request." }, { status: 500 });
  }
}

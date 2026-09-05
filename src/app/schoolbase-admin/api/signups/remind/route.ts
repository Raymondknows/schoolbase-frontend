import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

export async function POST(req: NextRequest) {
  try {
    const response = await fetch(`${getBackendUrl()}/schoolbase-admin/api/signups/remind`, {
      method: "POST",
      headers: {
        Cookie: req.headers.get("cookie") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(await req.json().catch(() => ({}))),
    });
    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || "Failed to send pending signup reminders" };
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying pending signup reminder:", error);
    return NextResponse.json({ message: "Failed to send pending signup reminders" }, { status: 500 });
  }
}
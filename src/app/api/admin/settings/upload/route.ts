import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { getCurrentSchoolId } from "@/lib/school";
import { uploadSchoolAssetToBackend } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const session = await getStaffSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const schoolId = await getCurrentSchoolId();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "signature" or "stamp"

    if (!file || !type) {
      return NextResponse.json({ success: false, message: "File and type are required" }, { status: 400 });
    }

    if (!["logo", "signature", "stamp"].includes(type)) {
      return NextResponse.json({ success: false, message: "Invalid type" }, { status: 400 });
    }

    const url = await uploadSchoolAssetToBackend(file, type as "logo" | "signature" | "stamp");

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

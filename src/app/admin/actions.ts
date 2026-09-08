"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getBackendUrl } from "@/lib/backend-url";

// Server actions removed for Vercel compatibility
// All backend operations must use API routes (e.g., POST /api/admin/...)
// This file is kept for build compatibility but contains no functional code

/**
 * Record a payment against an invoice
 * Server action that calls the frontend API route which proxies to the backend
 */
export async function recordPaymentAction(formData: FormData) {
  try {
    const invoiceId = formData.get("invoiceId") as string;
    const amount = formData.get("amount") as string;
    const method = formData.get("method") as string;
    const reference = formData.get("reference") as string;

    console.log("[recordPaymentAction] invoiceId:", invoiceId, "amount:", amount, "method:", method);

    if (!invoiceId || !amount || !method) {
      throw new Error("Missing required fields");
    }

    // Build absolute URL from headers (same pattern as signup actions)
    const headersList = await headers();
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/admin/fees/payments/record`;

    console.log("[recordPaymentAction] apiUrl:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      credentials: "include", // Automatically send cookies
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId,
        amount,
        method,
        reference: reference || null,
      }),
    });

    console.log("[recordPaymentAction] Response status:", response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const text = await response.text();
        console.error("[recordPaymentAction] Failed to parse error response:", text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      console.error("[recordPaymentAction] Error response:", errorData);
      throw new Error(errorData.error || "Failed to record payment");
    }

    const result = await response.json();
    console.log("[recordPaymentAction] Success:", result);

    // Redirect with success flag using redirect()
    redirect(`/admin/fees?paymentRecorded=1`);
  } catch (error) {
    // Re-throw Next.js redirect errors
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || (error as any).digest?.includes('NEXT_REDIRECT'))) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to record payment";
    console.error("[recordPaymentAction] Error:", message);
    throw new Error(message);
  }
}

export async function recordPayment(formData: FormData) {
  throw new Error("Use recordPaymentAction instead");
}

export async function createFeeScheduleAction() {
  throw new Error("Use POST /api/admin/fees/schedules instead");
}

export async function issueTermInvoicesAction() {
  throw new Error("Use POST /api/admin/invoices/issue instead");
}

export async function sendFeeRemindersAction() {
  throw new Error("Use POST /api/admin/fees/reminders instead");
}

export async function publishAssessment(...args: any[]): Promise<any> {
  throw new Error("Use POST /api/admin/assessments/publish instead");
}

export async function approveAssessment(...args: any[]): Promise<any> {
  throw new Error("Use POST /api/admin/assessments/approve instead");
}

export async function returnAssessmentToDraft(...args: any[]): Promise<any> {
  throw new Error("Use POST /api/admin/assessments/return-draft instead");
}

export async function returnAssessmentToDraftForm(...args: any[]): Promise<any> {
  throw new Error("Use POST /api/admin/assessments/return-draft instead");
}

export async function createClass() {
  throw new Error("Use POST /api/admin/classes instead");
}

export async function updateClass() {
  throw new Error("Use PATCH /api/admin/classes instead");
}

export async function deleteClass() {
  throw new Error("Use DELETE /api/admin/classes instead");
}

export async function saveAttendance() {
  throw new Error("Use POST /api/admin/attendance instead");
}

export async function createAnnouncement(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const body = formData.get("body") as string;
    const publish = formData.get("publish") === "on";
    const academicYearId = formData.get("academicYearId") as string | null;
    const termId = formData.get("termId") as string | null;
    const bulkApproval = formData.get("bulkApproval") === "on";

    if (!title || !body) {
      throw new Error("Title and body are required");
    }

    // Build absolute URL from headers (same pattern as other actions)
    const headersList = await headers();
    const backendUrl = getBackendUrl();
    const apiUrl = `${backendUrl}/api/admin/announcements`;
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const cookieHeader = headersList.get("cookie");
    if (cookieHeader) {
      requestHeaders.cookie = cookieHeader;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        title,
        body,
        publish,
        bulkApproval,
        academicYearId: academicYearId || undefined,
        termId: termId || undefined,
      }),
    });

    if (!response.ok) {
      const rawBody = await response.text();
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      if (rawBody) {
        try {
          const errorData = JSON.parse(rawBody);
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            errorMessage = `${errorMessage} - ${JSON.stringify(errorData)}`;
          }
        } catch {
          errorMessage = `${errorMessage} - ${rawBody}`;
        }
      }
      throw new Error(errorMessage);
    }

    // Redirect with success flag
    redirect(`/admin/website?created=1`);
  } catch (error) {
    // Re-throw Next.js redirect errors
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to create announcement";
    console.error("[createAnnouncement] Error:", message);
    throw new Error(message);
  }
}

export async function saveTeacherAssignments(formData: FormData) {
  throw new Error("Use POST /api/admin/teachers/assignments instead");
}

export async function createSubject(formData: FormData) {
  throw new Error("Use POST /api/admin/subjects instead");
}

export async function updateSubject(formData: FormData) {
  throw new Error("Use PATCH /api/admin/subjects instead");
}

export async function deleteSubject(formData: FormData) {
  throw new Error("Use DELETE /api/admin/subjects instead");
}

export async function createTeacher(formData: FormData) {
  throw new Error("Use POST /api/admin/teachers instead");
}

export async function updateTeacher(formData: FormData) {
  throw new Error("Use PATCH /api/admin/teachers instead");
}

export async function addTeacherClass() {
  throw new Error("Use POST /api/admin/teachers/classes instead");
}

export async function removeTeacherClass() {
  throw new Error("Use DELETE /api/admin/teachers/classes instead");
}

export async function addTeacherSubject() {
  throw new Error("Use POST /api/admin/teachers/subjects instead");
}

export async function removeTeacherSubject() {
  throw new Error("Use DELETE /api/admin/teachers/subjects instead");
}

export async function createAssessment() {
  throw new Error("Use POST /api/admin/assessments instead");
}

export async function createStudent() {
  throw new Error("Use POST /api/admin/students instead");
}

export async function updateStudent(...args: any[]): Promise<any> {
  throw new Error("Use PATCH /api/admin/students/[id] instead");
}


export async function createAcademicYear() {
  throw new Error("Use POST /api/admin/academic-years instead");
}

export async function createTerm() {
  throw new Error("Use POST /api/admin/terms instead");
}

export async function setCurrentAcademicYear() {
  throw new Error("Use PATCH /api/admin/academic-years/current instead");
}

export async function updateTerm(formData: FormData) {
  throw new Error("Use PATCH /api/admin/terms instead");
}

export async function saveResultMarks() {
  throw new Error("Use POST /api/admin/results instead");
}

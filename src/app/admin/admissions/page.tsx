"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Clock3,
  FileText,
  Loader2,
  Sparkles,
  Users,
  X,
  Eye,
} from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import { Button } from "@/components/ui/button";
import { UserGuide, type PageHelpGuide } from "@/components/ui/user-guide";
import SubscriptionModal from "@/components/subscription-modal";
import AdminSkeleton from "@/components/ui/skeleton";
import { playCloseTone, playOpenTone } from "@/lib/sounds";

const statusStyles: Record<string, string> = {
  SUBMITTED: "border-border bg-surface text-foreground",
  UNDER_REVIEW: "border-border bg-surface text-foreground",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
};

const statusBadgeStyles: Record<string, string> = {
  SUBMITTED: "border-border bg-surface text-foreground",
  UNDER_REVIEW: "border-border bg-surface text-foreground",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
};

const statusBadgeIcons: Record<string, typeof FileText> = {
  SUBMITTED: FileText,
  UNDER_REVIEW: Clock3,
  APPROVED: CheckCircle2,
  REJECTED: CircleX,
};

function getStatusLabel(status: string) {
  return String(status || "SUBMITTED")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function AdminAdmissionsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Success");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error" | "rejected">("success");
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const closeModalTimerRef = useRef<number | null>(null);
  const openModalTimerRef = useRef<number | null>(null);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<string | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<{ reason: string } | null>(null);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {
      total: applications.length,
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    applications.forEach((application) => {
      const status = String(application.status || "SUBMITTED").toUpperCase();
      if (status in counts) {
        counts[status] += 1;
      }
    });

    return counts;
  }, [applications]);

  async function loadApplications() {
    setLoading(true);
    setMessage(null);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/admissions`, { credentials: "include" });
      const data = await response.json().catch(() => null);

      if (response.status === 403 && data?.code === "SUBSCRIPTION_INACTIVE") {
        setSubscriptionBlocked({ reason: data?.reason || "Your school subscription is not active" });
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load admissions");
      }

      setApplications(data?.applications || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load admissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, []);

  async function updateStatus(id: string, status: string) {
    setUpdatingApplicationId(id);
    setMessage(null);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/admissions/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => null);

      if (response.status === 403 && data?.code === "SUBSCRIPTION_INACTIVE") {
        setSubscriptionBlocked({ reason: data?.reason || "Your school subscription is not active" });
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update status");
      }

      const nextApplication = {
        ...selectedApplication,
        status: data.application?.status || status,
        studentId: data.application?.studentId || selectedApplication?.studentId,
        admissionNo: data.student?.admissionNo || selectedApplication?.admissionNo,
        reviewedAt: data.application?.reviewedAt || new Date().toISOString(),
        reviewedBy: data.application?.reviewedBy || selectedApplication?.reviewedBy,
        updatedAt: data.application?.updatedAt || new Date().toISOString(),
      };

      setApplications((current) => current.map((application) => application.id === id ? { ...application, ...nextApplication } : application));
      setSelectedApplication((current: any) => current?.id === id ? { ...current, ...nextApplication } : current);

      const createdStudent = data.student ? ` A student record has been created (${data.student.id}).` : "";
      const studentCreationError = data?.studentCreationError;

      if (studentCreationError) {
        setModalType("error");
        setModalTitle("Something went wrong");
        setModalMessage(`The application was approved, but the student record could not be created automatically. ${studentCreationError}`);
        setSuccessModalOpen(true);
        playOpenTone();
        return;
      }

      if (status === "REJECTED") {
        setModalType("rejected");
        setModalTitle("Application Rejected");
        setModalMessage("The application has been rejected and will remain marked as rejected in the admin workflow.");
      } else if (status === "APPROVED") {
        setModalType("success");
        setModalTitle("Application Approved");
        setModalMessage(`The application has been approved successfully.${createdStudent}`);
      } else {
        setModalType("success");
        setModalTitle("Status updated");
        setModalMessage(`The application status has been updated successfully.${createdStudent}`);
      }

      setSuccessModalOpen(true);
      playOpenTone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update status");
      setModalType("error");
      setModalTitle("Something went wrong");
      setModalMessage(error instanceof Error ? error.message : "Unable to update status");
      setSuccessModalOpen(true);
      playOpenTone();
    } finally {
      setUpdatingApplicationId(null);
    }
  }

  const filteredApplications = useMemo(
    () => applications.filter((application) => statusFilter === "ALL" || application.status === statusFilter),
    [applications, statusFilter]
  );

  function openApplicationDetail(application: any) {
    setSelectedApplication(application);
    setDetailModalVisible(true);
    if (openModalTimerRef.current) {
      clearTimeout(openModalTimerRef.current);
    }
    openModalTimerRef.current = window.setTimeout(() => {
      setDetailModalOpen(true);
      openModalTimerRef.current = null;
    }, 10);
    playOpenTone();
  }

  function closeApplicationDetail() {
    setDetailModalOpen(false);
    if (openModalTimerRef.current) {
      clearTimeout(openModalTimerRef.current);
      openModalTimerRef.current = null;
    }
    if (closeModalTimerRef.current) {
      clearTimeout(closeModalTimerRef.current);
    }
    closeModalTimerRef.current = window.setTimeout(() => {
      setDetailModalVisible(false);
      setSelectedApplication(null);
      closeModalTimerRef.current = null;
    }, 500);
    playCloseTone();
  }

  if (subscriptionBlocked) {
    return <SubscriptionModal reason={subscriptionBlocked.reason} />;
  }

  const detailStatus = String(selectedApplication?.status || "SUBMITTED").toUpperCase();
  const detailStatusIcon = statusBadgeIcons[detailStatus] || FileText;
  const DetailStatusIcon = detailStatusIcon;
  const detailStatusClass = statusBadgeStyles[detailStatus] || statusBadgeStyles.SUBMITTED;

  const detailActionOptions = (() => {
    switch (detailStatus) {
      case "APPROVED":
        return ["UNDER_REVIEW", "REJECTED"];
      case "REJECTED":
        return ["APPROVED", "UNDER_REVIEW"];
      case "UNDER_REVIEW":
        return ["APPROVED", "REJECTED"];
      default:
        return ["APPROVED", "UNDER_REVIEW", "REJECTED"];
    }
  })();

  const HELP_GUIDE: PageHelpGuide = {
    title: "Managing Admissions Requests",
    overview:
      "Review incoming applications, confirm student and guardian details, and move applications through the correct workflow with confidence.",
    steps: [
      "Open application details to confirm contact information and student data.",
      "Use the status selector to mark requests as Under Review, Approved, or Rejected.",
      "Approve only when the application is complete and ready for enrollment.",
      "Use the Refresh button after updates so summary counts stay in sync.",
    ],
    commonTasks: [
      {
        title: "Review application completeness",
        description: "Check applicant contact details, student class, and supporting notes before approving.",
        tips: [
          "Verify the guardian email or phone number is filled in.",
          "Confirm the intended class matches the school’s availability.",
          "Look for any missing medical or background information that may require follow-up.",
        ],
      },
      {
        title: "Update status accurately",
        description: "Move applications through the admin workflow based on readiness and review outcomes.",
        tips: [
          "Use Under Review for incomplete or clarifying cases.",
          "Reject only when the application is invalid or the student cannot be admitted.",
          "Approve once all required information is confirmed.",
        ],
      },
    ],
    faqs: [
      {
        question: "What if the application is missing information?",
        answer: "Leave it Under Review and contact the applicant using the supplied email or phone number to request the missing details.",
      },
      {
        question: "Can I change status after approval?",
        answer: "Yes, you can move the application back to Under Review or Rejected if new information requires it.",
      },
    ],
    videoUrl: "/video-tutorials?topic=admissions",
  };

  if (loading && applications.length === 0 && !message && !subscriptionBlocked) {
    return (
      <main className="min-h-screen bg-background">
        <AdminSkeleton />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-12 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
        <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-10 sm:px-8 sm:pb-8 sm:pt-12">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand">
              <Users className="h-4 w-4" /> Student admissions
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Admissions requests</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review applications, confirm student details, and move each request through the admissions workflow.</p>
          </div>
          <Button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
            onClick={() => void loadApplications()}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
        </div>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="border border-border bg-surface p-5 transition hover:border-brand/40 hover:bg-brand-light/20">
            <div className="mb-4 flex items-center gap-2 text-brand">
              <Sparkles className="h-4 w-4 text-brand" />
              <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Total requests</span>
            </div>
            <div className="text-3xl font-semibold text-foreground">{summary.total}</div>
            <div className="mt-1 text-xs text-muted">All admission requests submitted</div>
          </div>
          <div className="border border-border bg-surface p-5 transition hover:border-brand/40 hover:bg-brand-light/20">
            <div className="mb-4 flex items-center gap-2 text-brand">
              <Clock3 className="h-4 w-4 text-brand" />
              <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Under review</span>
            </div>
            <div className="text-3xl font-semibold text-foreground">{summary.UNDER_REVIEW}</div>
            <div className="mt-1 text-xs text-muted">Waiting for final review</div>
          </div>
          <div className="border border-border bg-surface p-5 transition hover:border-brand/40 hover:bg-brand-light/20">
            <div className="mb-4 flex items-center gap-2 text-brand">
              <CheckCircle2 className="h-4 w-4 text-brand" />
              <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Approved</span>
            </div>
            <div className="text-3xl font-semibold text-foreground">{summary.APPROVED}</div>
            <div className="mt-1 text-xs text-muted">Ready for onboarding</div>
          </div>
          <div className="border border-border bg-surface p-5 transition hover:border-brand/40 hover:bg-brand-light/20">
            <div className="mb-4 flex items-center gap-2 text-brand">
              <CircleX className="h-4 w-4 text-brand" />
              <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Rejected</span>
            </div>
            <div className="text-3xl font-semibold text-foreground">{summary.REJECTED}</div>
            <div className="mt-1 text-xs text-muted">Declined or need follow-up</div>
          </div>
        </div>
        {message ? (
          <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {message}
          </div>
        ) : null}

        <UserGuide guide={HELP_GUIDE} />

        <section className="border border-border bg-surface">
          <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Incoming requests</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Admission applications</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                <span className="font-medium text-muted">Status filter</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="bg-transparent text-sm text-foreground outline-none"
                >
                  <option value="ALL">All</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading admissions...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted">
              No applications match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-background text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3">Applicant</th>
                    <th className="px-5 py-3">Child</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="align-top hover:bg-surface">
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground">{application.applicantName || `${application.firstName || ""} ${application.lastName || ""}`.trim() || "Unnamed applicant"}</div>
                        <div className="mt-1 text-xs text-muted">{application.intendedClass || "No intended class"}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground">{application.childName || "—"}</div>
                        <div className="mt-1 text-xs text-muted">{application.parentName || "—"}</div>
                        {application.admissionNo ? <div className="mt-1 text-xs font-semibold text-brand">{application.admissionNo}</div> : null}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-foreground">{application.email || "—"}</div>
                        <div className="mt-1 text-xs text-muted">{application.phone || "—"}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyles[application.status] || statusStyles.SUBMITTED}`}>
                            {application.status.replace(/_/g, " ")}
                          </span>
                          <select
                            value={application.status}
                            onChange={(event) => void updateStatus(application.id, event.target.value)}
                            disabled={updatingApplicationId === application.id}
                            className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
                          >
                            <option value="SUBMITTED">Submitted</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted">
                        <div className="flex items-center gap-2 text-xs">
                          <Clock3 className="h-3.5 w-3.5" />
                          {new Date(application.updatedAt || application.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openApplicationDetail(application)}
                          aria-label="View application details"
                          title="View application details"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white transition hover:bg-brand-hover"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[460px] overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]">
            <div className="flex items-start justify-between border-b border-border bg-brand/10 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-brand/20 bg-brand/10">
                  {modalType === "success" ? <CheckCircle2 className="h-5 w-5 text-brand" /> : modalType === "rejected" ? <CircleX className="h-5 w-5 text-brand" /> : <AlertTriangle className="h-5 w-5 text-brand" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{modalTitle}</h2>
                  <p className="mt-1 text-sm text-muted">{modalType === "success" ? "The request has been updated successfully." : modalType === "rejected" ? "The application status has been changed to rejected." : "Please review the message below and try again."}</p>
                </div>
              </div>
              <button type="button" aria-label="Close result modal" onClick={() => { playCloseTone(); setSuccessModalOpen(false); }} className="rounded-md border border-border bg-background p-2 text-muted transition hover:bg-surface hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 py-4 sm:px-5 sm:py-5"><p className="text-sm leading-6 text-foreground">{modalMessage}</p></div>
            <div className="border-t border-border bg-background px-4 py-4 sm:px-5">
              <button type="button" onClick={() => { playCloseTone(); setSuccessModalOpen(false); }} className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface">Close</button>
            </div>
          </div>
        </div>
      )}

      {detailModalVisible && selectedApplication && (
        <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-3 py-4 sm:px-4 transition-opacity duration-300 ease-out ${detailModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className={`w-full max-w-[1120px] max-h-[calc(100vh-1.5rem)] overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)] transition-all duration-500 ease-out ${detailModalOpen ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}`}>
            <div
              className="flex flex-col gap-4 border-b border-border bg-brand/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand/10"
                >
                  <DetailStatusIcon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Application details</p>
                  <h2 className="text-2xl font-semibold text-foreground mt-1">Application Review</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-semibold ${detailStatusClass}`}>
                  <DetailStatusIcon className="h-3.5 w-3.5" />
                  {getStatusLabel(detailStatus)}
                </span>
                <button
                  type="button"
                  aria-label="Close application review"
                  onClick={closeApplicationDetail}
                  className="rounded-md border border-border bg-surface p-2 text-muted transition hover:bg-background hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid max-h-[calc(100vh-14rem)] gap-0 overflow-y-auto lg:grid-cols-[1.7fr_0.9fr]">
              <div className="min-w-0 px-5 py-4 sm:px-6">
                <div className="space-y-3">
                  <section className="border border-border bg-surface p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted mb-4">Applicant Information</p>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">First Name</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.firstName || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Last Name</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.lastName || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Email</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.email || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Phone Number</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.phone || "—"}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="border border-border bg-surface p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted mb-4">Child Information</p>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Child Name</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{`${selectedApplication.studentFirstName || selectedApplication.childName || ""} ${selectedApplication.studentMiddleName || ""} ${selectedApplication.studentLastName || ""}`.replace(/\s+/g, " ").trim() || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Date of Birth</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.dateOfBirth ? new Date(selectedApplication.dateOfBirth).toLocaleDateString("en-NG") : "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Intended Class</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.intendedClass || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Parent / Guardian Name</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{`${selectedApplication.guardianFirst || ""} ${selectedApplication.guardianLast || ""}`.trim() || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Student Email</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.studentEmail || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Student Phone</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.studentPhone || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Gender</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.gender || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Admission Date</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.admissionDate ? new Date(selectedApplication.admissionDate).toLocaleDateString("en-NG") : "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Previous School</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.previousSchool || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Previous Class</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.previousClass || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg sm:col-span-2">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Address</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.address || "—"}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="border border-border bg-surface p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted mb-4">Guardian Information</p>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Guardian Name</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{`${selectedApplication.guardianFirst || ""} ${selectedApplication.guardianLast || ""}`.trim() || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Relationship</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.guardianRelationship || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Guardian Email</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.guardianEmail || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Guardian Phone</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.guardianPhone || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Alternate Phone</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.guardianAltPhone || "—"}</dd>
                      </div>
                      <div className="bg-background p-3 rounded-lg">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Occupation</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{selectedApplication.guardianOccupation || "—"}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="border border-border bg-surface p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted mb-4">Additional Information</p>
                    <div className="bg-background p-3 rounded-lg">
                      <p className="text-sm leading-6 text-foreground whitespace-pre-wrap">{selectedApplication.note || "No additional note was submitted for this application."}</p>
                    </div>
                  </section>
                </div>
              </div>

              <aside className="border-t border-border bg-background px-5 py-4 lg:border-l lg:border-t-0 lg:border-border lg:px-6">
                <div className="space-y-3">
                  {selectedApplication.photoUrl ? (
                    <section className="border border-border bg-surface p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted mb-4">Uploaded Photo</p>
                      <img src={selectedApplication.photoUrl} alt="Applicant photo" className="h-72 w-full rounded-lg object-cover" />
                    </section>
                  ) : null}

                  <section className="border border-border bg-surface p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted mb-4">Internal Review Notes</p>
                    <div className="mt-4 rounded-lg bg-background p-4 text-sm leading-6 text-foreground whitespace-pre-wrap">
                      {selectedApplication.note || "No internal review notes are currently attached to this application."}
                    </div>
                  </section>

                  <section className="rounded-lg border border-border bg-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Medical Notes</p>
                    <div className="mt-4 rounded-lg bg-background p-4 text-sm leading-6 text-foreground whitespace-pre-wrap">
                      {selectedApplication.medicalNotes || "—"}
                    </div>
                  </section>

                  <section className="rounded-lg border border-border bg-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Meta</p>
                    <dl className="mt-4 space-y-3 text-sm text-foreground">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Submitted</dt>
                        <dd className="mt-1">{new Date(selectedApplication.createdAt).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Last Updated</dt>
                        <dd className="mt-1">{new Date(selectedApplication.updatedAt).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</dd>
                      </div>
                      {selectedApplication.applicationNumber ? (
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Application Ref</dt>
                          <dd className="mt-1">{selectedApplication.applicationNumber}</dd>
                        </div>
                      ) : null}
                      {selectedApplication.admissionNo ? (
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Admission Number</dt>
                          <dd className="mt-1 font-semibold text-brand">{selectedApplication.admissionNo}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </section>
                </div>
              </aside>
            </div>

            <div className="sticky bottom-0 border-t border-border bg-background/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {detailActionOptions.includes("APPROVED") ? (
                    <button
                      type="button"
                      onClick={() => void updateStatus(selectedApplication.id, "APPROVED")}
                      className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                    >
                      Approve
                    </button>
                  ) : null}
                  {detailActionOptions.includes("UNDER_REVIEW") ? (
                    <button
                      type="button"
                      onClick={() => void updateStatus(selectedApplication.id, "UNDER_REVIEW")}
                      className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-border hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                    >
                      Under Review
                    </button>
                  ) : null}
                  {detailActionOptions.includes("REJECTED") ? (
                    <button
                      type="button"
                      onClick={() => void updateStatus(selectedApplication.id, "REJECTED")}
                      className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                    >
                      Reject
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={closeApplicationDetail}
                  className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-border hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

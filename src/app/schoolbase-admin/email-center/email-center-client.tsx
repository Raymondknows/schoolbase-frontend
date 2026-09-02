"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { ErrorModal } from "@/components/ui/error-modal";
import { getBackendUrl } from "@/lib/backend-url";
import { sendPlatformCommunicationEmailAction } from "@/app/schoolbase-admin/actions";

interface EmailLog {
  id: string;
  schoolId?: string;
  schoolName?: string;
  recipientEmail: string;
  recipientName?: string;
  emailType: string;
  subject: string;
  sentAt: string;
  status: string;
}

const EMAIL_TYPES = [
  { value: "PRODUCT_UPDATE", label: "Product update" },
  { value: "PRICE_UPDATE", label: "Pricing update" },
  { value: "SUBSCRIPTION_THANK_YOU", label: "Payment Confirmation" },
  { value: "SUPPORT_UPDATE", label: "Support update" },
  { value: "ONBOARDING_GUIDANCE", label: "Onboarding" },
  { value: "BEST_PRACTICE_TIP", label: "Best-practice guidance" },
  { value: "MANUAL_ANNOUNCEMENT", label: "Announcement" },
  { value: "POLICY_UPDATE", label: "Compliance update" },
  { value: "ACCOUNT_SECURITY", label: "Security notice" },
];

const PLATFORM_FEATURES = "Admissions, Student Records, Attendance, Fees, Payments, Timetable & Lesson Planning, Results, Report Cards, Staff Management, Parent Portal, School Website, and WhatsApp Communication";

const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  PRODUCT_UPDATE: {
    subject: "SchoolBase product update: smarter operations, stronger engagement, and more control",
    body: `Hello,

We’re pleased to share a new SchoolBase update designed to help your school run more efficiently, communicate more effectively, and manage operations with greater visibility.

This release strengthens the full SchoolBase experience across Admissions, Student Records, Attendance, Fees, Payments, Timetable & Lesson Planning, Results, Report Cards, Staff Management, Parent Portal, School Website, and WhatsApp Communication.

What’s new and improved:
• A more streamlined admin dashboard for attendance, fees, reports, and key school operations.
• Improved tools for timetable planning, lesson coordination, and academic scheduling.
• Faster communication workflows for parent updates, notices, and payment reminders.
• Better visibility into student performance and school-wide reporting across teams.
• Stronger support for modern school operations with improved usability and data consistency.

This update is part of our ongoing commitment to helping schools improve productivity, reduce manual work, and create a more professional experience for parents, students, and staff.

We encourage you to explore the latest improvements in SchoolBase and contact us if you would like tailored guidance on maximizing the platform for your school.`,
  },
  PRICE_UPDATE: {
    subject: "Important SchoolBase pricing update: more value, more flexibility, and better support",
    body: `Hello,

We’re writing to share an important update to our SchoolBase pricing structure. This revision reflects the value of the platform’s continued growth and the broader set of tools now available to schools, including Admissions, Student Records, Attendance, Fees, Payments, Timetable & Lesson Planning, Results, Report Cards, Staff Management, Parent Portal, School Website, and WhatsApp Communication.

Key points:
• A clearer pricing model designed to better match the scale and needs of schools growing over time.
• Continued investment in the features schools depend on every day, from scheduling to communication and reporting.
• Greater flexibility for schools that want broader operational support and digital transformation.

This update is intended to ensure your school continues to receive strong value from a platform that supports efficient management, parent communication, performance tracking, and digital school operations.

If you would like a tailored review of how this change affects your current plan, or if you want guidance on the best package for your school, please reply to this email and we will be happy to assist.`,
  },
  SUBSCRIPTION_THANK_YOU: {
    subject: "Thank you for choosing SchoolBase — your school is ready for smarter operations",
    body: `Hello,

Thank you for choosing SchoolBase. We are truly pleased to support your school and help your team work with more clarity, confidence, and efficiency every day.

Your subscription gives your school access to a comprehensive digital platform covering Admissions, Student Records, Attendance, Fees, Payments, Timetable & Lesson Planning, Results, Report Cards, Staff Management, Parent Portal, School Website, and WhatsApp Communication.

What this means for your school:
• Faster and more organized daily administration for staff and leadership.
• Better coordination of class schedules, teacher responsibilities, and student records.
• Improved communication with parents through the portal and WhatsApp channels.
• Stronger financial visibility through fee monitoring and payment tracking.
• More accurate reporting and result management for teachers and school leaders.
• A more professional digital presence through your school website and modern parent experience.

What to do next:
• Log in to SchoolBase and review your school dashboard.
• Confirm your school profile, departments, and staff information.
• Add classes, students, and timetable data.
• Publish fee schedules and activate parent access.
• Start using WhatsApp communication and reporting features to keep everyone informed.

We are excited to partner with your school as you build a more efficient and modern school experience. If you need any support at any stage, please reach out to us at info@schoolbase.live or contact us on WhatsApp at +2349031368963.

Thank you again for choosing SchoolBase — we are proud to be part of your school’s growth and success.`,
  },
  SUPPORT_UPDATE: {
    subject: "SchoolBase support update: we are actively handling your request",
    body: `Hello,

This is an update on your SchoolBase support request. Our team is currently reviewing the matter and will provide the next step shortly so your school can continue operating smoothly.

We are tracking your request within the broader SchoolBase platform experience, including ${PLATFORM_FEATURES}, so that we can resolve the issue efficiently and with full context.

Our team is committed to keeping your school’s operations moving while we work through the details. If there are any additional information or documents you would like to share, please reply directly to this email and we will continue from there.`,
  },
  ONBOARDING_GUIDANCE: {
    subject: "Welcome to SchoolBase — we’re excited to have your school on board",
    body: `Hello,

Welcome to SchoolBase. We’re excited to have your school on board and look forward to supporting you as you get started.

Our goal is to help you complete your setup and begin using SchoolBase effectively for your day-to-day school operations, including Admissions, Student Records, Attendance, Fees, Payments, Timetable & Lesson Planning, Results, Report Cards, Staff Management, Parent Portal, School Website, and WhatsApp Communication.

Key next steps:
• Confirm your school profile and contact information.
• Add your teachers, classes, and students.
• Set up and publish your fee schedules.
• Create your timetable and lesson structure.
• Share the relevant parent portal login information.
• Activate WhatsApp communication for parents and staff updates.

If you need help with any part of the setup, please reach out to me via WhatsApp at +234 703 961 3940. We’ll be happy to guide you through the process and help your school get started smoothly.

We look forward to helping your school get the most out of SchoolBase.`,
  },
  BEST_PRACTICE_TIP: {
    subject: "Best-practice guidance: improve school operations with SchoolBase",
    body: `Hello,

To help your school get the most out of SchoolBase, here are a few practical ways to use the platform more effectively across Admissions, Student Records, Attendance, Fees, Payments, Timetable & Lesson Planning, Results, Report Cards, Staff Management, Parent Portal, School Website, and WhatsApp Communication.

1) Keep your timetable and lesson plans current to reduce scheduling confusion and increase staff alignment.
2) Send automated fee reminders and parent notices early to reduce delays and improve communication.
3) Review attendance, report cards, and results regularly to support faster intervention where needed.
4) Use the parent portal and WhatsApp tools consistently to keep families informed and connected.
5) Make regular use of dashboards and reports so leaders can monitor performance in real time.

These steps help schools strengthen communication, improve accountability, and create a more efficient and professional experience for everyone involved.`,
  },
  MANUAL_ANNOUNCEMENT: {
    subject: "Important SchoolBase announcement: key update for your school operations",
    body: `Hello,

We have an important update for your school as part of our ongoing commitment to improving the SchoolBase experience.

This message covers core platform capabilities including Admissions, Student Records, Attendance, Fees, Payments, Timetable & Lesson Planning, Results, Report Cards, Staff Management, Parent Portal, School Website, and WhatsApp Communication.

[Add your announcement details here]

We encourage your administrative team to review this update carefully and align internal processes where needed. If you need guidance on how this change affects daily operations, please reply to this email and our team will support you.`,
  },
  POLICY_UPDATE: {
    subject: "SchoolBase policy update: important information for your school",
    body: `Hello,

We’re writing to share an important compliance and policy update for SchoolBase schools.

This update affects how schools manage student information, staff access, reporting, communication, and operational records across the platform, including Admissions, Student Records, Attendance, Fees, Payments, Timetable & Lesson Planning, Results, Report Cards, Staff Management, Parent Portal, School Website, and WhatsApp Communication.

Please note the following changes:
• Updated data-handling and privacy expectations for student and staff information.
• Stronger controls for access, approvals, and audit-friendly record keeping.
• Updated reporting expectations to support efficient school operations and accountability.

If you have any questions or would like help understanding the implications for your school, our team is available to assist and guide you through the update.`,
  },
  ACCOUNT_SECURITY: {
    subject: "Security notice: protect your SchoolBase accounts and school data",
    body: `Hello,

Your school’s security and data protection remain a top priority at SchoolBase. We encourage all administrators to take a few simple but important steps to protect accounts and maintain secure operations across the platform.

We recommend reviewing the following areas across SchoolBase modules, including Admissions, Student Records, Attendance, Fees, Payments, Timetable & Lesson Planning, Results, Report Cards, Staff Management, Parent Portal, School Website, and WhatsApp Communication:
• Use strong, unique passwords for all SchoolBase administrator accounts.
• Enable and maintain secure access controls for key staff members.
• Review login activity and unusual account behaviour promptly.
• Keep communication access limited to authorized personnel.

If you need support securing your account or reviewing the appropriate access settings for your school, please reply to this email and our team will be happy to assist.`,
  },
};

const SEGMENTS = [
  { value: "all", label: "All schools" },
  { value: "active", label: "Active schools" },
  { value: "trial", label: "Trial schools" },
  { value: "new", label: "New schools (last 7 days)" },
];

function InfoTooltip({ content }: { content: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 bg-background text-muted transition hover:border-brand hover:text-brand"
        aria-label="More information"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 top-6 z-20 w-64 rounded-xl border border-border/70 bg-white p-2.5 text-xs leading-5 text-foreground shadow-lg">
          {content}
        </div>
      )}
    </div>
  );
}

const DEFAULT_SUBJECTS: Record<string, string> = {
  PRODUCT_UPDATE: "SchoolBase product update: smarter operations, stronger engagement, and more control",
  SUPPORT_UPDATE: "SchoolBase support update: we are actively handling your request",
  ONBOARDING_GUIDANCE: "Welcome to SchoolBase — we’re excited to have your school on board",
  BEST_PRACTICE_TIP: "Best-practice guidance: improve school operations with SchoolBase",
  MANUAL_ANNOUNCEMENT: "Important SchoolBase announcement: key update for your school operations",
  PRICE_UPDATE: "Important SchoolBase pricing update: more value, more flexibility, and better support",
  SUBSCRIPTION_THANK_YOU: "Thank you for choosing SchoolBase — your school is ready for smarter operations",
  POLICY_UPDATE: "SchoolBase policy update: important information for your school",
  ACCOUNT_SECURITY: "Security notice: protect your SchoolBase accounts and school data",
};

interface School {
  id: string;
  name: string;
  email?: string;
  createdAt: string;
}

interface EmailLog {
  id: string;
  schoolId?: string;
  schoolName?: string;
  recipientEmail: string;
  recipientName?: string;
  emailType: string;
  subject: string;
  sentAt: string;
  status: string;
}

interface Props {
  initialSchools: School[];
  initialEmailLogs: EmailLog[];
  composeOpen: boolean;
  onOpenComposer: () => void;
  onCloseComposer: () => void;
}

export default function EmailCenterClient({
  initialSchools,
  initialEmailLogs,
  composeOpen,
  onOpenComposer,
  onCloseComposer,
}: Props) {
  const [selectedTarget, setSelectedTarget] = useState<"school" | "segment">(
    "school"
  );
  const [selectedSchoolId, setSelectedSchoolId] = useState(
    initialSchools[0]?.id ?? ""
  );
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [selectedEmailType, setSelectedEmailType] = useState(
    "MANUAL_ANNOUNCEMENT"
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error";
    title?: string;
    message: string;
    details?: string;
  }>({
    open: false,
    type: "success",
    message: "",
  });
  const [emailLogs, setEmailLogs] = useState(initialEmailLogs);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingSendPayload, setPendingSendPayload] = useState<null | {
    targetType: "school" | "segment";
    selectedSchoolId?: string;
    selectedSegment?: string;
    emailType: string;
    subject: string;
    body: string;
  }>(null);

  useEffect(() => {
    const template = EMAIL_TEMPLATES[selectedEmailType];
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  }, [selectedEmailType]);

  const selectedSchool = useMemo(
    () => initialSchools.find((school) => school.id === selectedSchoolId),
    [initialSchools, selectedSchoolId]
  );

  const targetCount = useMemo(() => {
    if (selectedTarget === "school") return 1;
    const segment = SEGMENTS.find((option) => option.value === selectedSegment);
    return segment && segment.value === "all" ? initialSchools.length : Math.max(1, Math.min(initialSchools.length, 12));
  }, [initialSchools.length, selectedSegment, selectedTarget]);

  const fetchEmailLogs = async (page = currentPage, pageSize = itemsPerPage) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });

      if (selectedEmailType && selectedEmailType !== "ALL") {
        params.append("emailType", selectedEmailType);
      }

      const response = await fetch(`/schoolbase-admin/api/email-logs?${params}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch email logs (${response.status})`);
      }

      const data = await response.json();
      setEmailLogs(data.logs || []);
      setTotalCount(data.pagination?.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching email logs:", err);
      setEmailLogs([]);
      setTotalCount(0);
    }
  };

  useEffect(() => {
    fetchEmailLogs(currentPage, itemsPerPage);
  }, [selectedEmailType, currentPage, itemsPerPage]);

  const emailTypeLabel = useMemo(
    () =>
      EMAIL_TYPES.find((option) => option.value === selectedEmailType)?.label ||
      "Manual email",
    [selectedEmailType]
  );

  const defaultSubject = DEFAULT_SUBJECTS[selectedEmailType] || "SchoolBase update";

  const refreshEmailLogs = async () => {
    await fetchEmailLogs(currentPage, itemsPerPage);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const openComposer = () => {
    playOpenTone();
    onOpenComposer();
  };

  const closeComposer = () => {
    playCloseTone();
    onCloseComposer();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!subject.trim()) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Validation required",
        message: "Please enter an email subject.",
      });
      return;
    }

    if (!body.trim()) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Validation required",
        message: "Please enter an email message.",
      });
      return;
    }

    if (selectedTarget === "school" && !selectedSchoolId) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Validation required",
        message: "Please select a school.",
      });
      return;
    }

    setPendingSendPayload({
      targetType: selectedTarget,
      selectedSchoolId: selectedTarget === "school" ? selectedSchoolId : undefined,
      selectedSegment: selectedTarget === "segment" ? selectedSegment : undefined,
      emailType: selectedEmailType,
      subject: subject.trim(),
      body: body.trim(),
    });

    onCloseComposer();
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!pendingSendPayload) return;

    setConfirmOpen(false);
    setSending(true);

    try {
      const result = await sendPlatformCommunicationEmailAction(pendingSendPayload);
      const message = `Sent ${result.sentCount} email(s). ${result.skippedCount} skipped.`;
      setSuccessMessage(message);
      setSuccessOpen(true);
      await refreshEmailLogs();
    } catch (err) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Send failed",
        message: err instanceof Error ? err.message : "Failed to send platform email.",
      });
    } finally {
      setSending(false);
      setPendingSendPayload(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_20px_rgba(15,23,42,0.02)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">Overview</span>
              <h2 className="mt-3 text-xl font-semibold text-foreground">Email summary</h2>
            </div>

            <button
              type="button"
              onClick={openComposer}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface"
            >
              Edit
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Target</p>
              <p className="mt-3 text-base font-bold text-foreground">{selectedTarget === "school" ? selectedSchool?.name || "School" : SEGMENTS.find((option) => option.value === selectedSegment)?.label || "Segment"}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Audience</p>
              <p className="mt-3 text-2xl font-bold text-foreground">{targetCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Template</p>
              <p className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">{EMAIL_TYPES.find((option) => option.value === selectedEmailType)?.label || "Custom email"}</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">Latest activity</p>
                <h3 className="mt-2 text-base font-semibold text-foreground">{emailLogs[0]?.status || "Ready to send"}</h3>
              </div>
              <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand">
                {emailLogs[0]?.emailType ? "Live" : "Ready"}
              </span>
            </div>
            {emailLogs[0] && (
              <p className="mt-3 text-sm text-muted">
                Last sent: {new Date(emailLogs[0].sentAt).toLocaleString()} · {emailLogs[0].subject}
              </p>
            )}
          </div>
        </section>

        <aside className="min-w-0 rounded-2xl border border-border bg-brand/5 p-4 text-sm text-foreground shadow-[0_8px_20px_rgba(15,23,42,0.02)] sm:p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">i</div>
            <p className="text-sm font-semibold text-foreground">Helpful guidance</p>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>• Keep messages concise and audience appropriate.</li>
            <li>• Use the selected template to maintain consistent tone.</li>
            <li>• Review the school or segment before sending.</li>
            <li>• Logs are preserved for follow-up and auditing.</li>
          </ul>
        </aside>
      </div>

      {composeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <style>{`
            @keyframes email_modal_enter { from { transform: translateY(18px) scale(.98); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
          `}</style>

          <div
            className="max-h-[82vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
            style={{ animation: "email_modal_enter 300ms cubic-bezier(.2,.9,.2,1)" }}
          >
            <div className="border-b border-border/70 bg-brand/10 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">Email composer</p>
                  <h2 className="mt-1 text-lg font-bold text-foreground sm:text-xl">Send platform communication</h2>
                  <p className="mt-1 text-xs text-muted">Choose the audience and message content, then confirm before sending.</p>
                </div>

                <button
                  type="button"
                  onClick={closeComposer}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-surface"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[calc(82vh-110px)] overflow-y-auto space-y-2 p-3 sm:p-4">
              <div className="grid gap-2.5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Template</label>
                    <select
                      value={selectedEmailType}
                      onChange={(event) => setSelectedEmailType(event.target.value)}
                      className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-xs text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                    >
                      {EMAIL_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Send to</label>
                    <div className="grid grid-cols-1 gap-2 rounded-xl bg-background p-1.5 sm:grid-cols-2">
                      <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs cursor-pointer transition hover:bg-slate-50">
                        <input
                          type="radio"
                          name="target"
                          value="school"
                          checked={selectedTarget === "school"}
                          onChange={() => setSelectedTarget("school")}
                          className="h-3.5 w-3.5 accent-brand"
                        />
                        Single school
                      </label>
                      <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs cursor-pointer transition hover:bg-slate-50">
                        <input
                          type="radio"
                          name="target"
                          value="segment"
                          checked={selectedTarget === "segment"}
                          onChange={() => setSelectedTarget("segment")}
                          className="h-3.5 w-3.5 accent-brand"
                        />
                        School segment
                      </label>
                    </div>
                  </div>

                  {selectedTarget === "school" ? (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Select school</label>
                      <select
                        value={selectedSchoolId}
                        onChange={(event) => setSelectedSchoolId(event.target.value)}
                        className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                      >
                        {initialSchools.map((school) => (
                          <option key={school.id} value={school.id}>{school.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Select segment</label>
                      <select
                        value={selectedSegment}
                        onChange={(event) => setSelectedSegment(event.target.value)}
                        className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                      >
                        {SEGMENTS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder={defaultSubject}
                      className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Quick notes</h3>
                  <ul className="mt-2 space-y-1 text-[11px] text-muted">
                    <li>• Keep the subject short and clear.</li>
                    <li>• Use the selected template to keep your tone consistent.</li>
                    <li>• Review the audience before sending.</li>
                    <li>• Email logs remain available for audit and follow-up.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Message</label>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={10}
                  placeholder={`Write your ${emailTypeLabel.toLowerCase()} message here.`}
                  className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-xs leading-5 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeComposer}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Send email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ErrorModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm email send"
        message={
          selectedTarget === "school"
            ? `This message will be sent to ${selectedSchool?.name || "the selected school"}.`
            : `This message will be sent to the ${SEGMENTS.find((option) => option.value === selectedSegment)?.label || "selected"} segment.`
        }
        type="success"
        confirmLabel="Send now"
        onSuccessAction={handleConfirmSend}
      />

      <ErrorModal
        isOpen={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          setSuccessMessage("");
        }}
        title="Email sent"
        message={successMessage}
        type="success"
        confirmLabel="Done"
      />

      <ErrorModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
        title={statusModal.title}
        message={statusModal.message}
        details={statusModal.details}
        type={statusModal.type}
        confirmLabel={statusModal.type === "success" ? "Okay" : "Try again"}
      />

      {selectedLog && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 px-4 py-8">
          <div className="h-full w-full max-w-2xl overflow-y-auto rounded-l-3xl border border-border bg-surface p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Email details</h3>
                <p className="mt-1 text-sm text-muted">View the full record for this email log.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm text-muted">
              <div>
                <p className="font-semibold text-foreground">School</p>
                <p>{selectedLog.schoolName ?? "Platform"}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Recipient</p>
                <p>{selectedLog.recipientEmail}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Type</p>
                <p>{selectedLog.emailType}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Subject</p>
                <p>{selectedLog.subject}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Status</p>
                <p>{selectedLog.status}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Sent</p>
                <p>{new Date(selectedLog.sentAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function playOpenTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const playTone = (freq: number, duration: number, gain: number, delay = 0) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);
      gainNode.gain.setValueAtTime(0.0001, now + delay);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + delay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration);
    };

    playTone(760, 0.14, 0.05, 0);
    playTone(1120, 0.14, 0.05, 0.07);
    setTimeout(() => ctx.close(), 700);
  } catch {
    // ignore unsupported browser audio
  }
}

function playCloseTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 420;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(0.04, now + 0.01);
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o.stop(now + 0.24);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // ignore unsupported browser audio
  }
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BellRing, LifeBuoy } from "lucide-react";
import AdminPageShell from "@/components/admin-page-shell";
import { ErrorModal } from "@/components/ui/error-modal";
import { sendDirectCampaignEmailAction } from "@/app/schoolbase-admin/actions";

const MAX_RECIPIENTS = 100;

const TEMPLATES: Record<string, { label: string; subject: string; body: string }> = {
  CONSULTANT_PARTNERSHIP: {
    label: "Consultant partnership outreach",
    subject: "SchoolBase partnership opportunity — build a profitable referral relationship",
    body: "Dear [Consultant's Name],\n\nI hope this email finds you well.\n\nMy name is Precious, and I work with SchoolBase, a modern school management platform built to help schools operate more efficiently, communicate more clearly, and deliver a stronger digital experience for parents and staff.\n\nSchoolBase brings together Admissions, Student Records, Attendance, Fees, Payments, Timetable & Lesson Planning, Results, Report Cards, Staff Management, Parent Portal, School Website, and WhatsApp Communication into one secure operating system for schools.\n\nGiven your work supporting schools across Nigeria, I am reaching out to explore a partnership opportunity. We would welcome the chance to work with consultants and education professionals who can help schools adopt a modern, scalable platform that improves everyday school operations.\n\nAs a referral partner, you would have the opportunity to introduce SchoolBase to schools in your network and earn a commission on successful subscriptions through your recommendations. SchoolBase offers schools a complete digital ecosystem that improves productivity, strengthens parent engagement, and supports long-term operational excellence.\n\nWhat schools gain with SchoolBase:\n• Streamlined school administration across admissions, records, fees, and attendance\n• Timetable planning, class coordination, and staff management tools\n• Real-time reporting for results, analytics, and school performance\n• Parent portal access and automated WhatsApp communication for accounts and updates\n• A built-in school website and a more professional parent-facing experience\n• Guided onboarding and implementation support to help schools go live quickly\n\nCurrent pricing for schools:\n• Starter: ₦60,000 per term\n• Growth: ₦85,000 per term\n• Custom pricing from ₦150,000 per term for larger groups and multi-school networks\n\nWe would welcome the opportunity to discuss a mutually beneficial partnership and explain how SchoolBase can support the schools in your network. I would be happy to schedule a short call at your convenience to explore this further.",
  },
  SCHOOL_PARTNERSHIP_INTRODUCTION: {
    label: "School partnership introduction",
    subject: "A smarter, more connected way to run your school operations",
    body: "Dear [School Administrator's Name],\n\nI hope this email finds you well.\n\nI am reaching out on behalf of SchoolBase, a modern school management platform designed to help schools strengthen their operations and improve communication across the entire school community.\n\nSchoolBase brings together the tools schools need to manage Admissions, Student Records, Attendance, Fees, Payments, Timetable & Lesson Planning, Results, Report Cards, Staff Management, Parent Portal, School Website, and WhatsApp Communication in one secure and easy-to-use system.\n\nSchoolBase helps schools:\n• Track fees, payment reminders, and parent communication in one place\n• Manage staff, classes, subjects, and academic schedules more effectively\n• Generate results and performance reports with greater speed and accuracy\n• Keep parents informed through structured communication and portal access\n• Launch a professional school website without requiring a separate solution\n• Reduce administrative workload and focus more on teaching and school growth\n\nCurrent pricing for schools:\n• Starter: ₦60,000 per term\n• Growth: ₦85,000 per term\n• Custom pricing from ₦150,000 per term for larger institutions\n\nIf your school is looking for a practical and professional way to improve operations, strengthen parent engagement, and modernize school management, we would be pleased to arrange a short demo tailored to your goals. Please reply to this email or contact us on WhatsApp at +234 903 136 8963.",
  },
  PARTNERSHIP_FOLLOW_UP: {
    label: "Partnership follow-up",
    subject: "Following up on a SchoolBase partnership opportunity",
    body: "Dear [Consultant's Name],\n\nI wanted to follow up on my earlier message regarding a potential partnership between your network and SchoolBase.\n\nWe are building meaningful partnerships with consultants, education professionals, and referral partners who support schools and help them adopt modern, scalable digital tools. SchoolBase is designed to support schools in areas such as Admissions, Student Records, Attendance, Fees, Payments, Timetable & Lesson Planning, Results, Report Cards, Staff Management, Parent Portal, School Website, and WhatsApp Communication.\n\nThis presents a strong opportunity for credible partners to recommend a platform that genuinely improves school operations while creating a rewarding referral relationship. We provide product demonstrations, onboarding support, implementation guidance, and responsive assistance for every partner and school we work with.\n\nOur current pricing structure is designed to be accessible and scalable for schools at different stages of growth:\n• Starter: ₦60,000\n• Growth: ₦85,000\n• School groups: custom pricing from ₦150,000\n\nIf this is relevant to your work and your school network, I would be glad to arrange a brief conversation to explain the referral process and answer any questions. We would value the opportunity to explore how SchoolBase can support the schools and communities you serve.",
  },
};

function parseRecipients(value: string) {
  const entries = value.split(/[\s,;]+/).map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  return Array.from(new Set(entries));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function CampaignPage() {
  const [templateKey, setTemplateKey] = useState("CONSULTANT_PARTNERSHIP");
  const [recipientsText, setRecipientsText] = useState("");
  const [subject, setSubject] = useState(TEMPLATES.CONSULTANT_PARTNERSHIP.subject);
  const [body, setBody] = useState(TEMPLATES.CONSULTANT_PARTNERSHIP.body);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [result, setResult] = useState<{ sent: string[]; failed: { email: string; error: string }[] } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [pendingSendPayload, setPendingSendPayload] = useState<null | {
    recipients: string[];
    emailType: string;
    subject: string;
    body: string;
  }>(null);

  const recipients = useMemo(() => parseRecipients(recipientsText), [recipientsText]);
  const validRecipients = useMemo(() => recipients.filter(isValidEmail), [recipients]);
  const invalidRecipients = useMemo(() => recipients.filter((email) => !isValidEmail(email)), [recipients]);

  const chooseTemplate = (key: string) => {
    const template = TEMPLATES[key];
    setTemplateKey(key);
    setSubject(template.subject);
    setBody(template.body);
    setNotice(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setResult(null);

    if (!recipients.length) return setNotice({ type: "error", text: "Enter at least one recipient email address." });
    if (invalidRecipients.length) return setNotice({ type: "error", text: `Fix invalid email address(es): ${invalidRecipients.join(", ")}` });
    if (validRecipients.length > MAX_RECIPIENTS) return setNotice({ type: "error", text: `A campaign can contain at most ${MAX_RECIPIENTS} recipients.` });
    if (!subject.trim() || !body.trim()) return setNotice({ type: "error", text: "Subject and message are required." });

    setPendingSendPayload({
      recipients: validRecipients,
      emailType: templateKey,
      subject: subject.trim(),
      body: body.trim(),
    });
    setConfirmOpen(true);
  };

  const closeComposer = () => {
    playCloseTone();
    setComposeOpen(false);
  };

  const openComposer = () => {
    playOpenTone();
    setComposeOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!pendingSendPayload) return;

    setConfirmOpen(false);
    setSending(true);

    try {
      const response = await sendDirectCampaignEmailAction(pendingSendPayload);
      setResult({ sent: response.sent || [], failed: response.failed || [] });
      const successText = `Campaign complete: ${response.sentCount} sent, ${response.failedCount} failed.`;

      if (response.failedCount === 0) {
        setSuccessMessage(successText);
        setSuccessOpen(true);
      } else {
        setNotice({ type: "error", text: successText });
      }
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Failed to send campaign." });
    } finally {
      setSending(false);
      setPendingSendPayload(null);
    }
  };

  return (
    <AdminPageShell
      title="Campaign"
      subtitle="Send a SchoolBase campaign to contacts without saving them as school records."
      actions={
        <>
          <Link href="/schoolbase-admin/setup-reminders" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface">
            <BellRing className="h-4 w-4" />
            Setup reminders
          </Link>
          <Link href="/schoolbase-admin/support" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface">
            <LifeBuoy className="h-4 w-4" />
            Support inbox
          </Link>
          <button
            type="button"
            onClick={openComposer}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
          >
            Compose campaign
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_20px_rgba(15,23,42,0.02)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">Overview</span>
                <h2 className="mt-3 text-xl font-semibold text-foreground">Campaign status</h2>
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
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Recipients</p>
                <p className="mt-3 text-2xl font-bold text-foreground">{validRecipients.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Invalid</p>
                <p className="mt-3 text-2xl font-bold text-foreground">{invalidRecipients.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Template</p>
                <p className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">{TEMPLATES[templateKey].label}</p>
              </div>
            </div>

            {notice && (
              <div className={`mt-5 rounded-xl border px-3 py-2.5 text-sm ${notice.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
                {notice.text}
              </div>
            )}

            {result && (
              <div className="mt-5 rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">Last campaign result</p>
                    <h3 className="mt-2 text-base font-semibold text-foreground">{result.sent.length} sent successfully</h3>
                  </div>
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-green-700">
                    Active
                  </span>
                </div>
                {result.failed.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm text-red-700">
                    {result.failed.map((item) => (
                      <li key={item.email} className="list-disc pl-5">{item.email}: {item.error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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
      </div>

      {composeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <style>{`
            @keyframes campaign_modal_enter { from { transform: translateY(18px) scale(.98); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
          `}</style>

          <div
            className="max-h-[82vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
            style={{ animation: "campaign_modal_enter 300ms cubic-bezier(.2,.9,.2,1)" }}
          >
            <div className="border-b border-border/70 bg-brand/10 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">Campaign composer</p>
                  <h2 className="mt-1 text-lg font-bold text-foreground sm:text-xl">Send to direct contacts</h2>
                  <p className="mt-1 text-xs text-muted">Enter comma-separated, space-separated, or line-separated addresses. Recipients are sent individually for privacy.</p>
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
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted" htmlFor="campaign-recipients">Recipients</label>
                    <textarea id="campaign-recipients" value={recipientsText} onChange={(event) => setRecipientsText(event.target.value)} rows={4} placeholder="contact-one@example.com, contact-two@example.com" className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
                      <span>{validRecipients.length} valid</span><span>{invalidRecipients.length} invalid</span><span>{recipients.length}/{MAX_RECIPIENTS} total</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted" htmlFor="campaign-template">Template</label>
                    <select id="campaign-template" value={templateKey} onChange={(event) => chooseTemplate(event.target.value)} className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10">
                      {Object.entries(TEMPLATES).map(([key, template]) => <option key={key} value={key}>{template.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted" htmlFor="campaign-subject">Subject</label>
                    <input id="campaign-subject" value={subject} onChange={(event) => setSubject(event.target.value)} className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Quick notes</h3>
                  <ul className="mt-2 space-y-1 text-[11px] text-muted">
                    <li>• Keep subject lines crisp and direct.</li>
                    <li>• Use the selected template as a fast-start.</li>
                    <li>• Personalize placeholders like [Consultant&apos;s Name].</li>
                    <li>• Review recipients before sending.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted" htmlFor="campaign-message">Message</label>
                <textarea id="campaign-message" value={body} onChange={(event) => setBody(event.target.value)} rows={10} className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-xs leading-5 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </div>

              {notice && <div className={`rounded-lg border px-2.5 py-2 text-xs ${notice.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.text}</div>}

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeComposer}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface"
                >
                  Close
                </button>
                <button type="submit" disabled={sending} className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60">
                  {sending ? "Sending campaign…" : "Send campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ErrorModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm campaign send"
        message={`This campaign will be sent to ${validRecipients.length} recipient(s). Each recipient will get a private message.`}
        type="success"
        confirmLabel="Send now"
        onSuccessAction={handleConfirmSend}
      />

      <ErrorModal
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Campaign sent"
        message={successMessage}
        type="success"
        confirmLabel="Done"
      />
    </AdminPageShell>
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


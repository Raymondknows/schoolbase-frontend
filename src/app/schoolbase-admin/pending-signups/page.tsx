"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle, ClipboardCheck, Clock3, Mail, Search, Send, ShieldCheck, UserCheck, X } from "lucide-react";
import { playCloseTone, playOpenTone } from "@/lib/sounds";
import { ErrorModal } from "@/components/ui/error-modal";

type Signup = { id: string; email: string; schoolName: string; slug: string; adminName: string; phone: string | null; country: string; attempts: number; expiresAt: string; createdAt: string; isExpired: boolean };
type Filter = "all" | "active" | "expired";

export default function PendingSignupsPage() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Signup | null>(null);
  const [previewTarget, setPreviewTarget] = useState<Signup | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState("");
  const [statusModal, setStatusModal] = useState<{ open: boolean; type: "success" | "error"; title: string; message: string }>({ open: false, type: "success", title: "", message: "" });

  async function loadSignups() {
    setLoading(true);
    try {
      const response = await fetch("/schoolbase-admin/api/signups/pending", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || data?.error || "Failed to load pending signups");
      setSignups(data.signups || []);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load pending signups");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadSignups(); }, []);

  const visibleSignups = useMemo(() => {
    const text = query.trim().toLowerCase();
    return signups.filter((signup) => {
      const statusMatches = filter === "all" || (filter === "expired" ? signup.isExpired : !signup.isExpired);
      const searchable = `${signup.schoolName} ${signup.adminName} ${signup.email} ${signup.phone || ""} ${signup.country}`.toLowerCase();
      return statusMatches && (!text || searchable.includes(text));
    });
  }, [filter, query, signups]);

  async function sendReminder(email?: string) {
    if (email) setBusyId(email); else setSendingAll(true);
    try {
      const response = await fetch("/schoolbase-admin/api/signups/remind", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(email ? { email } : {}) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Failed to send reminder");
      setStatusModal({ open: true, type: "success", title: email ? "Reminder Sent" : "Reminders Sent", message: email ? "The signup reminder was sent successfully." : `Sent ${data.sentCount} reminders. Skipped ${data.skippedCount}.` });
      await loadSignups();
    } catch (requestError) {
      setStatusModal({ open: true, type: "error", title: "Reminder Failed", message: requestError instanceof Error ? requestError.message : "Failed to send reminder" });
    }
    finally { setBusyId(null); setSendingAll(false); }
  }

  async function approveSignup() {
    if (!approveTarget) return;
    setBusyId(approveTarget.id);
    try {
      const response = await fetch("/schoolbase-admin/api/signups/approve", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: approveTarget.email }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Approve failed");
      setApproveTarget(null);
      await loadSignups();
    } catch (requestError) {
      setStatusModal({ open: true, type: "error", title: "Approval Failed", message: requestError instanceof Error ? requestError.message : "Approve failed" });
    }
    finally { setBusyId(null); }
  }

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><div className="flex items-center gap-2 text-sm font-medium text-brand"><ClipboardCheck size={17} /> Platform operations</div><h1 className="mt-2 text-3xl font-bold text-foreground">Pending signups</h1><p className="mt-1 text-muted">Follow up with schools that started registration but have not verified their email.</p></div>
          <div className="flex flex-wrap gap-3"><button onClick={() => { setPreviewTarget(previewTarget || signups[0] || null); playOpenTone(); }} disabled={!signups.length} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><Mail size={16} /> Email preview</button><button onClick={() => sendReminder()} disabled={sendingAll || !signups.length} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"><Send size={16} /> {sendingAll ? "Sending..." : "Remind all"}</button></div>
        </header>
        {error && <div className="rounded-lg border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-sm text-[#a61b29]">{error}</div>}
        <Stats signups={signups} />
        <Toolbar query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} count={visibleSignups.length} total={signups.length} />
        {loading ? <div className="rounded-lg border border-border bg-surface p-16 text-center text-muted">Loading your signup workspace...</div> : visibleSignups.length ? <Workspace signups={visibleSignups} busyId={busyId} sendingAll={sendingAll} onPreview={setPreviewTarget} onRemind={sendReminder} onApprove={setApproveTarget} /> : <EmptyState />}
      </div>
      <ErrorModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal((current) => ({ ...current, open: false }))}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        confirmLabel={statusModal.type === "success" ? "Okay" : "Try again"}
      />
      {previewTarget && <EmailPreview signup={previewTarget} onClose={() => { setPreviewTarget(null); playCloseTone(); }} />}
      {approveTarget && <ApproveModal signup={approveTarget} busy={busyId === approveTarget.id} onClose={() => setApproveTarget(null)} onConfirm={approveSignup} />}
    </main>
  );
}

function Stats({ signups }: { signups: Signup[] }) {
  const oldest = signups.length ? Math.max(0, Math.floor((Date.now() - new Date(signups[signups.length - 1].createdAt).getTime()) / 86400000)) : 0;
  const stats = [[<ClipboardCheck size={18} />, "Pending signups", signups.length, "Awaiting verification"], [<ShieldCheck size={18} />, "Still active", signups.filter((item) => !item.isExpired).length, "Code can be refreshed"], [<Clock3 size={18} />, "Expired codes", signups.filter((item) => item.isExpired).length, "Need a new code"], [<UserCheck size={18} />, "Oldest request", `${oldest}d`, "Time since signup started"]];
  return <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([icon, label, value, detail]) => <div key={String(label)} className="border border-border bg-surface p-5"><div className="mb-4 flex items-center gap-2 text-brand">{icon}<span className="text-xs font-bold uppercase tracking-[.12em] text-muted">{label}</span></div><div className="text-3xl font-semibold text-foreground">{value}</div><div className="mt-1 text-xs text-muted">{detail}</div></div>)}</section>;
}

function Toolbar({ query, setQuery, filter, setFilter, count, total }: { query: string; setQuery: (value: string) => void; filter: Filter; setFilter: (value: Filter) => void; count: number; total: number }) { return <section className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-center"><div className="flex flex-wrap items-center gap-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search school, admin or email" className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand sm:w-72" /></div><div className="flex rounded-lg border border-border bg-surface p-1 text-sm">{(["all", "active", "expired"] as Filter[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-md px-3 py-1.5 font-semibold capitalize ${filter === item ? "bg-brand text-white" : "text-muted"}`}>{item}</button>)}</div></div><span className="text-sm text-muted">Showing {count} of {total} requests</span></section>; }

function Workspace({ signups, busyId, sendingAll, onPreview, onRemind, onApprove }: { signups: Signup[]; busyId: string | null; sendingAll: boolean; onPreview: (signup: Signup) => void; onRemind: (email: string) => void; onApprove: (signup: Signup) => void }) { return <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[980px]"><thead className="bg-[#f6f8fa] text-left text-xs font-bold uppercase tracking-[.1em] text-muted"><tr><th className="px-5 py-4">School</th><th className="px-5 py-4">Contact</th><th className="px-5 py-4">Requested</th><th className="px-5 py-4">Verification</th><th className="px-5 py-4">Actions</th></tr></thead><tbody>{signups.map((signup) => <Row key={signup.id} signup={signup} busy={busyId === signup.email} sending={sendingAll} onPreview={onPreview} onRemind={onRemind} onApprove={onApprove} />)}</tbody></table></div><div className="divide-y divide-border md:hidden">{signups.map((signup) => <Card key={signup.id} signup={signup} busy={busyId === signup.email} sending={sendingAll} onPreview={onPreview} onRemind={onRemind} onApprove={onApprove} />)}</div></section>; }

function Actions({ signup, busy, sending, onPreview, onRemind, onApprove }: { signup: Signup; busy: boolean; sending: boolean; onPreview: () => void; onRemind: () => void; onApprove: () => void }) { return <div className="flex flex-wrap gap-2"><button onClick={onPreview} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-light"><Mail size={14} /> Preview</button><button onClick={onRemind} disabled={busy || sending} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><Bell size={14} /> Remind</button><button onClick={onApprove} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-hover"><CheckCircle size={14} /> Approve</button></div>; }

function Row({ signup, busy, sending, onPreview, onRemind, onApprove }: { signup: Signup; busy: boolean; sending: boolean; onPreview: (signup: Signup) => void; onRemind: (email: string) => void; onApprove: (signup: Signup) => void }) { return <tr className={`border-t border-border ${signup.isExpired ? "bg-[#fff8f8]" : "hover:bg-background"}`}><td className="px-5 py-4"><div className="font-semibold text-foreground">{signup.schoolName}</div><div className="mt-1 text-xs text-muted">{signup.slug} · {signup.country}</div></td><td className="px-5 py-4"><div className="font-medium text-foreground">{signup.adminName}</div><div className="mt-1 text-sm text-muted">{signup.email}</div><div className="mt-1 text-sm text-muted">{signup.phone || "Phone not provided"}</div></td><td className="px-5 py-4 text-sm text-muted">{new Date(signup.createdAt).toLocaleDateString()}</td><td className="px-5 py-4"><Status signup={signup} /></td><td className="px-5 py-4"><Actions signup={signup} busy={busy} sending={sending} onPreview={() => onPreview(signup)} onRemind={() => onRemind(signup.email)} onApprove={() => onApprove(signup)} /></td></tr>; }

function Card({ signup, busy, sending, onPreview, onRemind, onApprove }: { signup: Signup; busy: boolean; sending: boolean; onPreview: (signup: Signup) => void; onRemind: (email: string) => void; onApprove: (signup: Signup) => void }) { return <article className={`p-5 ${signup.isExpired ? "bg-[#fff8f8]" : "bg-surface"}`}><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-foreground">{signup.schoolName}</h2><p className="mt-1 text-xs text-muted">{signup.adminName} · {signup.country}</p></div><Status signup={signup} compact /></div><p className="mt-4 break-all text-sm text-foreground">{signup.email}</p><p className="mt-2 break-all text-sm text-muted">{signup.phone || "Phone not provided"}</p><p className="mt-2 text-xs text-muted">Requested {new Date(signup.createdAt).toLocaleDateString()} · {signup.attempts} attempts</p><div className="mt-5"><Actions signup={signup} busy={busy} sending={sending} onPreview={() => onPreview(signup)} onRemind={() => onRemind(signup.email)} onApprove={() => onApprove(signup)} /></div></article>; }

function Status({ signup, compact = false }: { signup: Signup; compact?: boolean }) { return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${signup.isExpired ? "bg-[#fff0f0] text-[#b42318]" : "bg-[#fff4d6] text-[#8a5a00]"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{signup.isExpired ? "Code expired" : "Awaiting code"}{!compact && <span className="ml-1 font-normal opacity-80">· {signup.attempts} attempts</span>}</span>; }
function EmptyState() { return <div className="rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] p-14 text-center"><ClipboardCheck className="mx-auto text-brand" size={34} /><h2 className="mt-4 text-xl font-semibold text-foreground">No pending signups in this view</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">New signup requests will appear here when a school starts registration.</p></div>; }

function EmailPreview({ signup, onClose }: { signup: Signup; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-[#f3f2ef] shadow-2xl lg:flex-row"><aside className="hidden w-72 shrink-0 border-r border-border bg-surface p-6 lg:block"><p className="text-xs font-bold uppercase tracking-[.12em] text-brand">Email preview</p><h2 className="mt-2 text-xl font-semibold text-foreground">Signup reminder</h2><p className="mt-2 text-sm leading-6 text-muted">This mirrors the branded email sent to this pending signup.</p><div className="mt-8 space-y-4 text-sm"><div><p className="text-xs uppercase tracking-[.12em] text-muted">To</p><p className="mt-1 break-all font-medium text-foreground">{signup.email}</p></div><div><p className="text-xs uppercase tracking-[.12em] text-muted">Subject</p><p className="mt-1 font-medium text-foreground">Complete your SchoolBase signup - {signup.schoolName}</p></div></div><button onClick={onClose} className="mt-8 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light"><X size={15} /> Close preview</button></aside><div className="overflow-y-auto p-4 sm:p-8 lg:flex-1"><div className="mb-4 flex items-center justify-between lg:hidden"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-brand">Email preview</p><h2 className="mt-1 font-semibold text-foreground">Signup reminder</h2></div><button onClick={onClose} className="rounded-lg border border-border p-2 text-muted" aria-label="Close preview"><X size={18} /></button></div><div className="mx-auto max-w-[620px] overflow-hidden rounded-lg border border-[#e0e0e0] bg-white shadow-sm"><div className="bg-[#0a66c2] px-7 py-8 text-center text-white"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl font-bold">S</div><h1 className="mt-3 text-2xl font-bold">SchoolBase</h1><p className="mt-1 text-sm text-white/85">Complete Your Signup</p></div><div className="px-7 py-8 text-[#191919]"><p>Hi {signup.adminName},</p><p className="mt-4 leading-7">You started creating a SchoolBase account for <strong>{signup.schoolName}</strong>, but your signup is still waiting for email verification.</p><p className="mt-5 leading-7">Use this verification code to complete your signup:</p><div className="my-5 rounded-lg bg-[#e8f4fc] py-5 text-center text-3xl font-bold tracking-[.25em] text-[#0a66c2]">123456</div><p className="text-center text-xs text-[#666]">This code expires in 10 minutes.</p><div className="my-7 text-center"><span className="inline-flex rounded-lg bg-[#0a66c2] px-5 py-3 text-sm font-bold text-white">Continue Signup</span></div><div className="border-l-4 border-[#0a66c2] bg-[#e8f4fc] px-4 py-3 text-sm leading-6"><strong>Security tip:</strong> Never share this code with anyone. SchoolBase staff will never ask for it.</div><p className="mt-6 text-sm">Need help? <span className="text-[#0a66c2]">Contact Support</span></p></div><div className="border-t border-[#e0e0e0] px-7 py-5 text-center text-xs text-[#666]"><p>© 2026 SchoolBase. All rights reserved.</p><p className="mt-1">Questions? support@schoolbase.live</p></div></div></div></div></div>; }

function ApproveModal({ signup, busy, onClose, onConfirm }: { signup: Signup; busy: boolean; onClose: () => void; onConfirm: () => void }) { return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"><div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-xl"><div className="flex items-start justify-between border-b border-border bg-background/40 px-6 py-5"><div className="flex gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand"><CheckCircle size={23} /></div><div><h2 className="text-xl font-bold text-foreground">Approve signup</h2><p className="mt-1 text-sm text-muted">Create the school and admin account.</p></div></div><button onClick={onClose} className="rounded-lg border border-border p-1.5 text-muted hover:bg-background" aria-label="Close"><X size={17} /></button></div><div className="px-6 py-5 text-sm leading-6 text-foreground">Approve <strong>{signup.schoolName}</strong> for <strong>{signup.adminName}</strong> ({signup.email})?</div><div className="flex gap-3 border-t border-border bg-background px-6 py-4"><button onClick={onClose} disabled={busy} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-50">Cancel</button><button onClick={onConfirm} disabled={busy} className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50">{busy ? "Approving..." : "Confirm approval"}</button></div></div></div>; }

"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Link2, RefreshCw, Unlink } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";

type PupilOption = { id: string; firstName: string; middleName: string | null; lastName: string; admissionNo: string | null; class: { name: string } | null; competitionAccount: { id: string; status: string } | null };
type UserOption = { id: string; name: string };
type LinkRow = { id: string; pupilId: string; userId: string; status: string; linkedAt: string; pupil: { firstName: string; lastName: string; admissionNo: string | null; class: { name: string } | null }; user: { name: string } };

export default function CompetitionStudentAccountsPage() {
  const [pupils, setPupils] = useState<PupilOption[]>([]);
  const [studentUsers, setStudentUsers] = useState<UserOption[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [pupilId, setPupilId] = useState("");
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function request(path: string, init?: RequestInit) {
    const response = await fetch(`${getBackendUrl()}/api/competition${path}`, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error === "FEATURE_DISABLED" ? "Enable the Competition master switch in platform settings before managing student links." : data.error || "Competition request failed.");
    return data;
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await request("/school/student-links");
      setPupils(data.pupils || []);
      setStudentUsers(data.studentUsers || []);
      setLinks(data.links || []);
      if (!pupilId) setPupilId(data.pupils?.find((pupil: PupilOption) => !pupil.competitionAccount)?.id || "");
      if (!userId) setUserId(data.studentUsers?.[0]?.id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load account links.");
    } finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);

  async function createLink() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await request("/school/student-links", { method: "POST", body: JSON.stringify({ pupilId, userId }) });
      setMessage("Student account linked. The user must sign in through the existing SchoolBase login.");
      setPupilId("");
      setUserId("");
      await load();
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : "Unable to link student account.");
    } finally { setBusy(false); }
  }

  async function revokeLink(linkId: string) {
    if (!window.confirm("Revoke this student-to-pupil Competition link? This will immediately block the linked user from Competition.")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await request(`/school/student-links/${linkId}`, { method: "DELETE" });
      setMessage("Student Competition link revoked.");
      await load();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Unable to revoke student link.");
    } finally { setBusy(false); }
  }

  const availablePupils = pupils.filter((pupil) => !pupil.competitionAccount);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <header className="flex flex-col justify-between gap-4 border border-border bg-surface p-6 sm:flex-row sm:items-end sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">School administration</p><h1 className="mt-2 text-3xl font-semibold text-foreground">Competition accounts</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Link existing STUDENT-role SchoolBase users to existing active pupil records in your school. This does not create accounts or change login credentials.</p></div><button type="button" onClick={() => void load()} disabled={loading || busy} className="inline-flex h-10 items-center gap-2 border border-border px-3 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button></header>
      {error ? <div role="alert" className="flex items-start gap-2 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
      {message ? <div role="status" className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}

      <section className="space-y-4 border border-border bg-surface p-5"><div><h2 className="font-semibold text-foreground">Link existing accounts</h2><p className="mt-1 text-xs leading-5 text-muted">A user and pupil can each have only one link. The API verifies both records belong to the authenticated school and that the pupil is active.</p></div><div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"><label className="text-xs font-semibold text-muted">Active pupil<select value={pupilId} onChange={(event) => setPupilId(event.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground"><option value="">Choose pupil</option>{availablePupils.map((pupil) => <option key={pupil.id} value={pupil.id}>{pupil.firstName} {pupil.lastName} · {pupil.admissionNo || "No admission no."} · {pupil.class?.name || "Unassigned"}</option>)}</select></label><label className="text-xs font-semibold text-muted">Existing student login<select value={userId} onChange={(event) => setUserId(event.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground"><option value="">Choose STUDENT user</option>{studentUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label><button type="button" onClick={() => void createLink()} disabled={busy || loading || !pupilId || !userId} className="inline-flex h-10 items-center justify-center gap-2 bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"><Link2 className="h-4 w-4" /> Link account</button></div><p className="text-xs text-muted">Available: {availablePupils.length} pupils · {studentUsers.length} unlinked student accounts</p></section>

      <section className="border border-border bg-surface"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold text-foreground">Linked Competition identities</h2><p className="mt-1 text-xs text-muted">Revocation takes effect on the next authenticated Competition request.</p></div><span className="text-sm tabular-nums text-muted">{links.length} links</span></div><div className="divide-y divide-border">{links.map((link) => <article key={link.id} className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"><div><p className="font-semibold text-foreground">{link.pupil.firstName} {link.pupil.lastName} <span className="font-normal text-muted">↔</span> {link.user.name}</p><p className="mt-1 text-xs text-muted">{link.pupil.admissionNo || "No admission number"} · {link.pupil.class?.name || "Unassigned"} · Linked {new Date(link.linkedAt).toLocaleDateString()}</p></div><div className="flex items-center gap-3"><span className={`border px-2 py-1 text-xs font-semibold ${link.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-background text-muted"}`}>{link.status}</span>{link.status === "ACTIVE" ? <button type="button" disabled={busy} onClick={() => void revokeLink(link.id)} className="inline-flex h-9 items-center gap-2 border border-border px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Unlink className="h-3.5 w-3.5" /> Revoke</button> : null}</div></article>)}{!loading && links.length === 0 ? <div className="p-10 text-center text-sm text-muted">No student accounts are linked yet.</div> : null}</div></section>
    </main>
  );
}

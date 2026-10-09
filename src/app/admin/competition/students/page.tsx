"use client";

import { useEffect, useState } from "react";
import { Link2, RefreshCw, Unlink } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import { ErrorModal } from "@/components/ui/error-modal";

type GuardianLink = { relation: string | null; guardian: { id: string; firstName: string; lastName: string; phone: string | null; whatsapp: string | null; email: string | null } | null };
type PupilOption = { id: string; firstName: string; middleName: string | null; lastName: string; admissionNo: string | null; class: { name: string } | null; guardians?: GuardianLink[]; competitionAccount: { id: string; status: string } | null };
type LinkRow = { id: string; pupilId: string; userId: string | null; guardianId: string | null; status: string; linkedAt: string; pupil: { firstName: string; lastName: string; admissionNo: string | null; class: { name: string } | null }; guardian: { firstName: string; lastName: string } | null; user: { name: string } | null };

export default function CompetitionStudentAccountsPage() {
  const [pupils, setPupils] = useState<PupilOption[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [pupilId, setPupilId] = useState("");
  const [guardianId, setGuardianId] = useState("");
  const [pendingRevokeLinkId, setPendingRevokeLinkId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  async function request(path: string, init?: RequestInit) {
    const response = await fetch(`${getBackendUrl()}/api/competition${path}`, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    const errorMessages: Record<string, string> = {
      FEATURE_DISABLED: "Enable the Competition master switch in platform settings before managing guardian links.",
      PUPIL_AND_GUARDIAN_REQUIRED: "Choose both a student and one of their linked guardians.",
      PUPIL_OR_GUARDIAN_NOT_ELIGIBLE: "That guardian is not linked to this active student in SchoolBase.",
      PUPIL_ALREADY_LINKED: "This student already has a Competition identity link.",
      ACTIVE_LINK_NOT_FOUND: "This active guardian link could not be found. Refresh the page and try again.",
      SCHOOL_ADMIN_REQUIRED: "Only a school administrator can manage Competition guardian links.",
      AUTH_REQUIRED: "Your session has expired. Sign in again and retry.",
    };
    if (!response.ok) throw new Error(errorMessages[data.error] || data.error || "Competition request failed.");
    return data;
  }

  async function load(): Promise<string | null> {
    setLoading(true);
    setFeedbackModal(null);
    try {
      const data = await request("/school/student-links");
      setPupils(data.pupils || []);
      setLinks(data.links || []);
      if (!pupilId) {
        const firstAvailable = data.pupils?.find((pupil: PupilOption) => !pupil.competitionAccount);
        setPupilId(firstAvailable?.id || "");
        setGuardianId(firstAvailable?.guardians?.[0]?.guardian?.id || "");
      }
      return null;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load guardian links.";
      setFeedbackModal({ type: "error", title: "Competition guardian links could not be loaded", message });
      return message;
    } finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);

  async function createLink() {
    setBusy(true);
    setFeedbackModal(null);
    try {
      await request("/school/student-links", { method: "POST", body: JSON.stringify({ pupilId, guardianId }) });
      setPupilId("");
      setGuardianId("");
      const refreshError = await load();
      setFeedbackModal(refreshError
        ? { type: "error", title: "Competition link saved; list refresh failed", message: "The guardian relationship was saved, but the updated list could not be loaded. Refresh the page to confirm it.", details: refreshError }
        : { type: "success", title: "Competition link saved", message: "The guardian relationship is linked to the student’s Competition record. Guardian sign-in to Competition is not enabled yet." });
    } catch (linkError) {
      setFeedbackModal({ type: "error", title: "Guardian could not be connected", message: linkError instanceof Error ? linkError.message : "Unable to connect the guardian." });
    } finally { setBusy(false); }
  }

  async function revokeLink(linkId: string) {
    setFeedbackModal(null);
    setPendingRevokeLinkId(linkId);
  }

  async function confirmRevokeLink(linkId: string) {
    setBusy(true);
    setFeedbackModal(null);
    try {
      await request(`/school/student-links/${linkId}`, { method: "DELETE" });
      const refreshError = await load();
      setFeedbackModal(refreshError
        ? { type: "error", title: "Competition link revoked; list refresh failed", message: "The link was revoked, but the updated list could not be loaded. Refresh the page to confirm it.", details: refreshError }
        : { type: "success", title: "Competition link revoked", message: "The saved guardian-to-student Competition link has been revoked. The SchoolBase parent portal relationship is unchanged." });
    } catch (revokeError) {
      setFeedbackModal({ type: "error", title: "Guardian link could not be revoked", message: revokeError instanceof Error ? revokeError.message : "Unable to revoke guardian link." });
    } finally {
      setBusy(false);
      setPendingRevokeLinkId(null);
    }
  }

  const availablePupils = pupils.filter((pupil) => !pupil.competitionAccount);
  const selectedPupil = pupils.find((pupil) => pupil.id === pupilId);
  const availableGuardians = (selectedPupil?.guardians || []).filter((link) => link.guardian);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <header className="flex flex-col justify-between gap-4 border border-border bg-surface p-6 sm:flex-row sm:items-end sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">School administration</p><h1 className="competition-heading-light mt-2 text-3xl font-semibold text-foreground">Competition student links</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Connect each student’s existing SchoolBase guardian relationship to a Competition identity. Guardian sign-in is not yet connected to the student challenge flow.</p></div><button type="button" onClick={() => void load()} disabled={loading || busy} className="inline-flex h-10 items-center gap-2 border border-border px-3 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button></header>

      <section className="space-y-4 border border-border bg-surface p-5"><div><h2 className="font-semibold text-foreground">Connect a student’s guardian to Competition</h2><p className="mt-1 text-xs leading-5 text-muted">Choose a student, then choose one of the guardians already connected to that student in SchoolBase. This records the relationship; parent sign-in to Competition remains a separate pending step.</p></div><div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"><label className="text-xs font-semibold text-muted">Active student<select value={pupilId} onChange={(event) => { const nextPupilId = event.target.value; const nextPupil = pupils.find((pupil) => pupil.id === nextPupilId); setPupilId(nextPupilId); setGuardianId(nextPupil?.guardians?.[0]?.guardian?.id || ""); }} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground"><option value="">Choose student</option>{availablePupils.map((pupil) => <option key={pupil.id} value={pupil.id}>{pupil.firstName} {pupil.lastName} · {pupil.admissionNo || "No admission no."} · {pupil.class?.name || "Unassigned"}</option>)}</select></label><label className="text-xs font-semibold text-muted">Guardian already linked to this student<select value={guardianId} onChange={(event) => setGuardianId(event.target.value)} disabled={!selectedPupil || availableGuardians.length === 0} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground disabled:opacity-60"><option value="">{selectedPupil ? "Choose linked guardian" : "Choose a student first"}</option>{availableGuardians.map(({ relation, guardian }) => guardian ? <option key={guardian.id} value={guardian.id}>{guardian.firstName} {guardian.lastName} · {relation || "Guardian"}{guardian.phone ? ` · ${guardian.phone}` : ""}</option> : null)}</select></label><button type="button" onClick={() => void createLink()} disabled={busy || loading || !pupilId || !guardianId} className="inline-flex h-10 items-center justify-center gap-2 bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"><Link2 className="h-4 w-4" /> Connect guardian</button></div>{selectedPupil && availableGuardians.length === 0 ? <p className="text-sm text-amber-800">This student has no guardian relationship in SchoolBase yet. Add the guardian to the student record first.</p> : null}<p className="text-xs text-muted">Available: {availablePupils.length} students with {pupils.filter((pupil) => !pupil.competitionAccount && pupil.guardians?.some((link) => link.guardian)).length} existing guardian relationships</p></section>

      <section className="border border-border bg-surface"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold text-foreground">Linked Competition identities</h2><p className="mt-1 text-xs text-muted">These records link SchoolBase guardians to pupils; guardian sign-in to Competition is still pending.</p></div><span className="text-sm tabular-nums text-muted">{links.length} links</span></div><div className="divide-y divide-border">{links.map((link) => <article key={link.id} className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"><div><p className="font-semibold text-foreground">{link.pupil.firstName} {link.pupil.lastName} <span className="font-normal text-muted">↔</span> {link.guardian ? `${link.guardian.firstName} ${link.guardian.lastName}` : link.user?.name || "Legacy user link"}</p><p className="mt-1 text-xs text-muted">{link.pupil.admissionNo || "No admission number"} · {link.pupil.class?.name || "Unassigned"} · Linked {new Date(link.linkedAt).toLocaleDateString()}</p></div><div className="flex items-center gap-3"><span className={`border px-2 py-1 text-xs font-semibold ${link.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-background text-muted"}`}>{link.status}</span>{link.status === "ACTIVE" ? <button type="button" disabled={busy} onClick={() => void revokeLink(link.id)} className="inline-flex h-9 items-center gap-2 border border-border px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Unlink className="h-3.5 w-3.5" /> Revoke</button> : null}</div></article>)}{!loading && links.length === 0 ? <div className="p-10 text-center text-sm text-muted">No guardian-linked pupil accounts have been created yet.</div> : null}</div></section>
      <ErrorModal
        isOpen={Boolean(pendingRevokeLinkId)}
        onClose={() => setPendingRevokeLinkId(null)}
        title="Revoke Competition link?"
        message="Revoke this saved guardian-to-student Competition link? This does not change the guardian's SchoolBase parent portal access."
        type="error"
        confirmLabel="Revoke link"
        confirmDisabled={busy}
        onConfirm={async () => {
          if (pendingRevokeLinkId) await confirmRevokeLink(pendingRevokeLinkId);
          return false;
        }}
        action={{ label: "Keep link", onClick: () => setPendingRevokeLinkId(null) }}
      />
      <ErrorModal isOpen={Boolean(feedbackModal)} onClose={() => setFeedbackModal(null)} title={feedbackModal?.title} message={feedbackModal?.message || ""} details={feedbackModal?.details} type={feedbackModal?.type || "error"} confirmLabel={feedbackModal?.type === "success" ? "Done" : "Okay"} />
    </main>
  );
}

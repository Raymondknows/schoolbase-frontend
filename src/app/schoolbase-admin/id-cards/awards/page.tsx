"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Gift, RotateCw, X } from "lucide-react";

type School = { id: string; name: string; country?: string | null };
type Award = {
  id: string;
  schoolId: string;
  schoolName: string;
  awardType: string;
  unitsGranted: number;
  unitsReserved: number;
  unitsRedeemed: number;
  currency: string;
  reasonCategory: string;
  reason?: string | null;
  terms?: string | null;
  eligibleTiers: string[];
  status: string;
  expiresAt?: string | null;
  createdBy: string;
  approvedBy?: string | null;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "ID-card awards request failed.");
  return data as T;
}

export default function IdCardAwardsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [units, setUnits] = useState(25);
  const [reasonCategory, setReasonCategory] = useState("ONBOARDING");
  const [reason, setReason] = useState("");
  const [terms, setTerms] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    const [schoolData, awardData] = await Promise.all([
      requestJson<{ schools: School[] }>("/schoolbase-admin/api/schools?limit=500"),
      requestJson<{ awards: Award[] }>("/schoolbase-admin/api/id-cards/awards"),
    ]);
    setSchools(schoolData.schools || []);
    setAwards(awardData.awards || []);
    setSchoolId((current) => current || schoolData.schools?.[0]?.id || "");
  };

  useEffect(() => {
    load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load awards."));
  }, []);

  const createAward = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await requestJson<{ award: Award }>("/schoolbase-admin/api/id-cards/awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          awardType: "UNITS",
          unitsGranted: units,
          currency: "NGN",
          reasonCategory,
          reason,
          terms: terms || undefined,
          eligibleTiers: ["STANDARD", "PREMIUM"],
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });
      setReason("");
      setNotice(`Award ${result.award.id} created and awaiting approval by a different platform administrator.`);
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create award.");
    } finally {
      setBusy(false);
    }
  };

  const approve = async (awardId: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await requestJson(`/schoolbase-admin/api/id-cards/awards/${encodeURIComponent(awardId)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotice("Award approved. Eligible schools can use its units for a complete card batch.");
      await load();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Unable to approve award.");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (awardId: string) => {
    const reason = window.prompt("Reason for revoking this unused award (at least 8 characters):")?.trim();
    if (!reason || reason.length < 8) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await requestJson(`/schoolbase-admin/api/id-cards/awards/${encodeURIComponent(awardId)}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      setNotice("Unused award revoked and recorded in its audit ledger.");
      await load();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Unable to revoke award.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link href="/schoolbase-admin/id-cards" className="text-sm font-semibold text-brand hover:text-brand-hover">ID Card Studio</Link>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Free card awards</h1>
            <p className="mt-2 text-muted">Issue audited card-unit grants. Approval by a second platform administrator is required.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/schoolbase-admin/id-cards/pricing" className="border border-border px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light">Pricing</Link>
            <button type="button" onClick={() => load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to refresh awards."))} className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light"><RotateCw className="h-4 w-4" /> Refresh</button>
          </div>
        </header>

        {error ? <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
        {notice ? <div role="status" className="border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div> : null}

        <section className="border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-10 w-10 items-center justify-center bg-brand/10 text-brand"><Gift className="h-5 w-5" /></span>
            <div><h2 className="font-semibold text-foreground">Issue card-unit award</h2><p className="text-xs text-muted">Awards cover full orders only. Unused units remain available until expiry or redemption.</p></div>
          </div>
          <form onSubmit={createAward} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-foreground">School
              <select required value={schoolId} onChange={(event) => setSchoolId(event.target.value)} className="mt-1.5 h-11 w-full border border-border bg-background px-3 font-normal"><option value="" disabled>Select school</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}{school.country ? ` · ${school.country}` : ""}</option>)}</select>
            </label>
            <label className="text-sm font-semibold text-foreground">Card units
              <input required type="number" min="1" max="1000" value={units} onChange={(event) => setUnits(Number(event.target.value))} className="mt-1.5 h-11 w-full border border-border bg-background px-3 font-normal" />
            </label>
            <label className="text-sm font-semibold text-foreground">Reason category
              <select value={reasonCategory} onChange={(event) => setReasonCategory(event.target.value)} className="mt-1.5 h-11 w-full border border-border bg-background px-3 font-normal"><option value="TRIAL">Trial</option><option value="ONBOARDING">Onboarding</option><option value="SERVICE_RECOVERY">Service recovery</option><option value="PARTNER">Partner</option><option value="CAMPAIGN">Campaign</option></select>
            </label>
            <label className="text-sm font-semibold text-foreground">Expiry (optional)
              <input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className="mt-1.5 h-11 w-full border border-border bg-background px-3 font-normal" />
            </label>
            <label className="text-sm font-semibold text-foreground sm:col-span-2">Internal reason (minimum 8 characters)
              <input required minLength={8} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Record why this school is receiving free card units" className="mt-1.5 h-11 w-full border border-border bg-background px-3 font-normal" />
            </label>
            <label className="text-sm font-semibold text-foreground sm:col-span-2">Terms shown to school (optional)
              <textarea value={terms} onChange={(event) => setTerms(event.target.value)} rows={2} className="mt-1.5 w-full border border-border bg-background p-3 text-sm font-normal" />
            </label>
            <div className="sm:col-span-2 flex justify-end"><button type="submit" disabled={busy || !schoolId || units < 1 || reason.trim().length < 8} className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"><Gift className="h-4 w-4" /> Create pending award</button></div>
          </form>
        </section>

        <section className="border border-border bg-surface p-5">
          <h2 className="font-semibold text-foreground">Award ledger</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead><tr className="border-b border-border text-xs text-muted"><th className="py-2 font-medium">School</th><th className="py-2 font-medium">Status</th><th className="py-2 font-medium">Reason</th><th className="py-2 font-medium">Granted</th><th className="py-2 font-medium">Reserved</th><th className="py-2 font-medium">Redeemed</th><th className="py-2 font-medium">Available</th><th className="py-2"></th></tr></thead>
              <tbody>
                {awards.map((award) => {
                  const available = Math.max(0, award.unitsGranted - award.unitsReserved - award.unitsRedeemed);
                  return <tr key={award.id} className="border-b border-border last:border-0"><td className="py-3 font-semibold text-foreground">{award.schoolName}</td><td className="py-3">{award.status}</td><td className="py-3 text-muted">{award.reasonCategory}{award.reason ? ` · ${award.reason}` : ""}</td><td className="py-3">{award.unitsGranted}</td><td className="py-3">{award.unitsReserved}</td><td className="py-3">{award.unitsRedeemed}</td><td className="py-3 font-semibold text-foreground">{available}</td><td className="py-3 text-right">{award.status === "PENDING_APPROVAL" ? <button type="button" onClick={() => approve(award.id)} disabled={busy} className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Approve</button> : null}{award.status === "APPROVED" && award.unitsReserved === 0 ? <button type="button" onClick={() => revoke(award.id)} disabled={busy} className="ml-2 inline-flex items-center gap-1.5 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><X className="h-3.5 w-3.5" /> Revoke unused</button> : null}</td></tr>;
                })}
                {!awards.length ? <tr><td colSpan={8} className="py-6 text-center text-muted">No card awards yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

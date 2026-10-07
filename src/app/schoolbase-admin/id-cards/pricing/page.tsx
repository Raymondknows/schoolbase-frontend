"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeDollarSign, Check, Clock3, Plus, Save } from "lucide-react";
import { ErrorModal } from "@/components/ui/error-modal";

type PricingBand = { from: number; through: number | null; unitPriceMinor: number };
type PricingRule = {
  currency: string;
  taxRateBps: number;
  volumeBands: PricingBand[];
  premiumTemplateUpliftMinor: Record<string, number>;
};
type PricingVersion = {
  id: string;
  version: number;
  isActive: boolean;
  effectiveAt: string;
  reason: string;
  createdBy: string;
  approvedBy?: string | null;
  rule: PricingRule | null;
};
type PricingPreview = {
  currency: string;
  quantity: number;
  templateId: string;
  templateTier: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  upliftPerCardMinor: number;
  bandBreakdown: Array<{ from: number; through: number; quantity: number; unitPriceMinor: number; lineTotalMinor: number }>;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Pricing request failed.");
  return data as T;
}

function toMajor(minor: number) {
  return (minor / 100).toFixed(2);
}

function toMinor(major: string) {
  const amount = Number(major);
  return Number.isFinite(amount) ? Math.round(amount * 100) : -1;
}

function formatMinor(amount: number, currency: string) {
  const safeCurrency = /^[A-Z]{3}$/.test(currency) ? currency : "NGN";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: safeCurrency, maximumFractionDigits: 0 }).format(amount / 100);
}

export default function IdCardPricingPage() {
  const [versions, setVersions] = useState<PricingVersion[]>([]);
  const [rule, setRule] = useState<PricingRule | null>(null);
  const [baselineRule, setBaselineRule] = useState<PricingRule | null>(null);
  const [reason, setReason] = useState("");
  const [effectiveAt, setEffectiveAt] = useState("");
  const [previewQuantity, setPreviewQuantity] = useState(50);
  const [previewTemplate, setPreviewTemplate] = useState("modernInstitution");
  const [preview, setPreview] = useState<PricingPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusModal, setStatusModal] = useState<{ open: boolean; type: "success" | "error"; title: string; message: string }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const load = async (preserveEditor = false) => {
    const data = await requestJson<{ defaultRule: PricingRule; rules: PricingVersion[] }>("/schoolbase-admin/api/id-cards/pricing");
    setVersions(data.rules || []);
    if (preserveEditor && rule) {
      setBaselineRule(rule);
      return;
    }
    const active = data.rules.find((version) => version.isActive && version.rule && new Date(version.effectiveAt).getTime() <= Date.now())?.rule;
    const selectedRule = active || data.defaultRule;
    const nextRule = {
      ...selectedRule,
      premiumTemplateUpliftMinor: {
        ...data.defaultRule.premiumTemplateUpliftMinor,
        ...selectedRule.premiumTemplateUpliftMinor,
      },
    };
    setRule(nextRule);
    setBaselineRule(nextRule);
  };

  useEffect(() => {
    load().catch((loadError) => setStatusModal({ open: true, type: "error", title: "Pricing could not be loaded", message: loadError instanceof Error ? loadError.message : "Unable to load pricing." }));
  }, []);

  const hasPricingChanges = Boolean(rule && baselineRule && JSON.stringify(rule) !== JSON.stringify(baselineRule));

  const updateBand = (index: number, update: Partial<PricingBand>) => {
    setRule((current) => current ? {
      ...current,
      volumeBands: current.volumeBands.map((band, bandIndex) => bandIndex === index ? { ...band, ...update } : band),
    } : current);
  };

  const normalizeBands = () => {
    setRule((current) => current ? {
      ...current,
      volumeBands: current.volumeBands.map((band, index, bands) => ({
        ...band,
        from: index === 0 ? 1 : bands[index - 1].through === null ? 1 : Number(bands[index - 1].through) + 1,
        through: index === bands.length - 1 ? null : band.through,
      })),
    } : current);
  };

  const saveDraft = async () => {
    if (!rule) return;
    if (!hasPricingChanges) {
      setStatusModal({ open: true, type: "error", title: "No pricing changes", message: "Change at least one pricing value before saving a draft." });
      return;
    }
    if (reason.trim().length < 8) {
      setStatusModal({ open: true, type: "error", title: "Add a reason for this change", message: "Enter a reason of at least 8 characters so the pricing version has a clear audit record." });
      return;
    }
    setBusy(true);
    try {
      await requestJson("/schoolbase-admin/api/id-cards/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule, reason, effectiveAt: effectiveAt ? new Date(effectiveAt).toISOString() : undefined }),
      });
      setReason("");
      setEffectiveAt("");
      await load(true);
      setStatusModal({ open: true, type: "success", title: "Pricing draft saved", message: "The new version is ready for review. You can approve it here; approval will apply it to new quotes while existing quotes and orders remain unchanged." });
    } catch (saveError) {
      setStatusModal({ open: true, type: "error", title: "Pricing draft was not saved", message: saveError instanceof Error ? saveError.message : "Unable to save pricing draft." });
    } finally {
      setBusy(false);
    }
  };

  const calculatePreview = async () => {
    if (!rule) return;
    setBusy(true);
    try {
      const data = await requestJson<{ quote: PricingPreview }>("/schoolbase-admin/api/id-cards/pricing/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule, quantity: previewQuantity, templateId: previewTemplate }),
      });
      setPreview(data.quote);
    } catch (previewError) {
      setPreview(null);
      setStatusModal({ open: true, type: "error", title: "Quote preview failed", message: previewError instanceof Error ? previewError.message : "Unable to calculate preview quote." });
    } finally {
      setBusy(false);
    }
  };

  const approveDraft = async (draftId: string) => {
    setBusy(true);
    try {
      await requestJson(`/schoolbase-admin/api/id-cards/pricing/${encodeURIComponent(draftId)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setStatusModal({ open: true, type: "success", title: "Pricing approved", message: "This version is active for new quotes. Existing quotes and orders remain unchanged." });
      await load();
    } catch (approveError) {
      setStatusModal({ open: true, type: "error", title: "Pricing approval failed", message: approveError instanceof Error ? approveError.message : "Unable to approve pricing draft." });
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
            <h1 className="mt-2 text-3xl font-bold text-foreground">ID Card Pricing</h1>
            <p className="mt-2 text-muted">Create auditable price versions and approve them for new quotes. Existing quotes and orders keep their original pricing.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/schoolbase-admin/id-cards/awards" className="inline-flex items-center gap-2 border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light">Awards</Link>
            <Link href="/schoolbase-admin/id-cards" className="inline-flex items-center gap-2 border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light">Back to usage</Link>
          </div>
        </header>

        {rule ? (
          <section className="border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="flex h-10 w-10 items-center justify-center bg-brand/10 text-brand"><BadgeDollarSign className="h-5 w-5" /></span>
              <div>
                <h2 className="font-semibold text-foreground">Proposed pricing</h2>
                <p className="text-xs text-muted">Amounts are entered in major currency units and stored in integer minor units.</p>
              </div>
            </div>

            <div className="grid gap-4 py-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-foreground">Currency
                <input value={rule.currency} maxLength={3} onChange={(event) => setRule({ ...rule, currency: event.target.value.toUpperCase() })} className="mt-1.5 h-11 w-full border border-border bg-background px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold text-foreground">Tax rate (%)
                <input type="number" min="0" max="100" step="0.01" value={(rule.taxRateBps / 100).toString()} onChange={(event) => setRule({ ...rule, taxRateBps: Math.round(Number(event.target.value || 0) * 100) })} className="mt-1.5 h-11 w-full border border-border bg-background px-3 font-normal" />
              </label>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Volume bands</h3>
                  <p className="mt-1 text-xs text-muted">Rates apply marginally to the cards in each quantity band.</p>
                </div>
                <button type="button" onClick={() => {
                  setRule((current) => {
                    if (!current) return current;
                    const bands = [...current.volumeBands];
                    const last = bands[bands.length - 1];
                    if (last?.through === null) bands[bands.length - 1] = { ...last, through: last.from + 49 };
                    const nextFrom = bands.length ? Number(bands[bands.length - 1].through) + 1 : 1;
                    return { ...current, volumeBands: [...bands, { from: nextFrom, through: null, unitPriceMinor: last?.unitPriceMinor || 0 }] };
                  });
                }} className="inline-flex items-center gap-2 border border-border px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-light"><Plus className="h-4 w-4" /> Add band</button>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[540px] text-left text-sm">
                  <thead><tr className="border-b border-border text-xs text-muted"><th className="py-2 font-medium">From card</th><th className="py-2 font-medium">Through</th><th className="py-2 font-medium">Price per card</th><th className="py-2"></th></tr></thead>
                  <tbody>
                    {rule.volumeBands.map((band, index) => (
                      <tr key={`band-${index}`} className="border-b border-border last:border-b-0">
                        <td className="py-2.5 text-foreground">{band.from}</td>
                        <td className="py-2.5">{index === rule.volumeBands.length - 1 ? <span className="text-muted">No limit</span> : <input type="number" min={band.from} value={band.through ?? ""} onChange={(event) => updateBand(index, { through: Number(event.target.value) })} onBlur={normalizeBands} className="h-9 w-28 border border-border bg-background px-2" />}</td>
                        <td className="py-2.5"><label className="flex items-center gap-2"><span className="text-xs text-muted">{rule.currency}</span><input type="number" min="0" step="0.01" value={toMajor(band.unitPriceMinor)} onChange={(event) => updateBand(index, { unitPriceMinor: toMinor(event.target.value) })} className="h-9 w-32 border border-border bg-background px-2" /></label></td>
                        <td className="py-2.5 text-right">{rule.volumeBands.length > 1 ? <button type="button" onClick={() => setRule({ ...rule, volumeBands: rule.volumeBands.filter((_, bandIndex) => bandIndex !== index).map((item, bandIndex, bands) => ({ ...item, from: bandIndex === 0 ? 1 : Number(bands[bandIndex - 1].through) + 1, through: bandIndex === bands.length - 1 ? null : item.through })) })} className="text-xs font-semibold text-red-700 hover:underline">Remove</button> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Premium design uplift per card</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["houseTeam", "House & Team"],
                  ["earlyLearners", "Early Learners"],
                  ["seniorCollege", "Senior / College"],
                  ["signatureCollection", "Signature Collection"],
                ].map(([id, label]) => (
                  <label key={id} className="text-xs font-semibold text-foreground">{label}
                    <div className="mt-1 flex items-center gap-2"><span className="text-xs text-muted">{rule.currency}</span><input type="number" min="0" step="0.01" value={toMajor(rule.premiumTemplateUpliftMinor[id] || 0)} onChange={(event) => setRule({ ...rule, premiumTemplateUpliftMinor: { ...rule.premiumTemplateUpliftMinor, [id]: toMinor(event.target.value) } })} className="h-10 w-full border border-border bg-background px-3 text-sm font-normal" /></div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Quote simulator</h3>
              <p className="mt-1 text-xs text-muted">Test this draft rule without saving it or changing school quotes.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr_auto] sm:items-end">
                <label className="text-xs font-semibold text-foreground">Card quantity
                  <input type="number" min="1" max="1000" value={previewQuantity} onChange={(event) => setPreviewQuantity(Number(event.target.value))} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-foreground">Design
                  <select value={previewTemplate} onChange={(event) => setPreviewTemplate(event.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm font-normal">
                    <option value="crestClassic">Crest Classic · Standard</option>
                    <option value="modernInstitution">Modern Institution · Standard</option>
                    <option value="inkSaver">Ink Saver · Standard</option>
                    <option value="houseTeam">House &amp; Team · Premium</option>
                    <option value="earlyLearners">Early Learners · Premium</option>
                    <option value="seniorCollege">Senior / College · Premium</option>
                    <option value="signatureCollection">Signature Collection · Premium</option>
                  </select>
                </label>
                <button type="button" onClick={calculatePreview} disabled={busy} className="inline-flex h-10 items-center justify-center border border-border px-3 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50">Calculate quote</button>
              </div>
              {preview ? (
                <div className="mt-4 border-l-2 border-brand pl-4">
                  <div className="space-y-2 text-sm">
                    {preview.bandBreakdown.map((band, index) => <div key={`${band.from}-${index}`} className="flex justify-between gap-3 text-muted"><span>{band.quantity} × {formatMinor(band.unitPriceMinor, preview.currency)} cards ({band.from}–{band.through})</span><span className="shrink-0 text-foreground">{formatMinor(band.lineTotalMinor, preview.currency)}</span></div>)}
                    {preview.upliftPerCardMinor > 0 ? <div className="flex justify-between gap-3 text-muted"><span>Premium uplift ({preview.quantity} cards)</span><span className="text-foreground">{formatMinor(preview.upliftPerCardMinor * preview.quantity, preview.currency)}</span></div> : null}
                    <div className="flex justify-between border-t border-border pt-2 text-muted"><span>Subtotal</span><span className="font-semibold text-foreground">{formatMinor(preview.subtotalMinor, preview.currency)}</span></div>
                    <div className="flex justify-between text-muted"><span>Tax</span><span className="text-foreground">{formatMinor(preview.taxMinor, preview.currency)}</span></div>
                    <div className="flex justify-between text-base font-bold text-foreground"><span>Total</span><span className="text-brand">{formatMinor(preview.totalMinor, preview.currency)}</span></div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-foreground">Effective date (optional)
                <input type="datetime-local" value={effectiveAt} onChange={(event) => setEffectiveAt(event.target.value)} className="mt-1.5 h-11 w-full border border-border bg-background px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold text-foreground">Reason for change
                <input value={reason} onChange={(event) => setReason(event.target.value)} aria-describedby="pricing-reason-help" placeholder="Explain why this price version is changing" className="mt-1.5 h-11 w-full border border-border bg-background px-3 font-normal" />
                <span id="pricing-reason-help" className="mt-1 block text-xs font-normal text-muted">At least 8 characters; stored with this pricing version for audit history.</span>
              </label>
            </div>
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted" aria-live="polite">{hasPricingChanges ? "Unsaved pricing changes" : "No pricing changes to save"}</p>
              <button type="button" onClick={saveDraft} disabled={busy || !hasPricingChanges} className="inline-flex items-center justify-center gap-2 bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" /> {busy ? "Saving…" : "Save pricing draft"}</button>
            </div>
          </section>
        ) : <p className="border border-border bg-surface p-5 text-sm text-muted">Loading pricing settings…</p>}

        <section className="border border-border bg-surface p-5">
          <h2 className="font-semibold text-foreground">Pricing versions</h2>
          <div className="mt-3 divide-y divide-border">
            {versions.map((version) => (
              <article key={version.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">Version {version.version}</h3>
                    {version.isActive && new Date(version.effectiveAt).getTime() <= Date.now() ? <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"><Check className="h-3 w-3" /> Approved</span> : version.isActive ? <span className="inline-flex items-center gap-1 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-800"><Clock3 className="h-3 w-3" /> Scheduled</span> : <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800"><Clock3 className="h-3 w-3" /> Draft</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted">{version.reason} · Effective {new Date(version.effectiveAt).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-muted">Created by {version.createdBy}{version.approvedBy ? ` · Approved by ${version.approvedBy}` : ""}</p>
                  {version.rule ? <p className="mt-1 text-xs text-muted">{version.rule.currency} · {version.rule.volumeBands.length} volume bands · tax {(version.rule.taxRateBps / 100).toFixed(2)}%</p> : <p className="mt-1 text-xs text-red-700">Stored rule is invalid; do not approve.</p>}
                </div>
                {!version.isActive && !version.approvedBy && version.rule ? <button type="button" onClick={() => approveDraft(version.id)} disabled={busy} className="inline-flex shrink-0 items-center justify-center gap-2 border border-border px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50">{busy ? "Approving…" : "Approve pricing"}</button> : null}
              </article>
            ))}
            {versions.length === 0 ? <p className="py-4 text-sm text-muted">No pricing versions yet.</p> : null}
          </div>
        </section>
      </div>
      <ErrorModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal((current) => ({ ...current, open: false }))}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        confirmLabel={statusModal.type === "success" ? "Done" : "Try again"}
      />
    </main>
  );
}

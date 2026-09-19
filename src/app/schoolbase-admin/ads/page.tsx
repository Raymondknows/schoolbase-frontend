"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BadgeCheck, BarChart3, Building2, CheckCircle2, Megaphone, ShieldCheck, Sparkles, TrendingUp, X } from "lucide-react";
import { playCloseTone, playOpenTone, unlockAudio } from "@/lib/sounds";
import { ErrorModal } from "@/components/ui/error-modal";

const tabs = ["Overview", "Advertisers", "Campaigns", "Placements", "Approvals", "Analytics"] as const;

type Summary = {
  activeCampaigns: number;
  pendingApprovals: number;
  monthlyRevenue: number;
  impressions: number;
  clicks: number;
  ctr: number;
};

export default function PlatformAdsPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [advertisers, setAdvertisers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"advertiser" | "campaign" | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ open: boolean; type: "success" | "error"; title: string; message: string; details?: string }>({ open: false, type: "success", title: "", message: "" });
  const [advertiserForm, setAdvertiserForm] = useState({ companyName: "", contactName: "", email: "", category: "" });
  const [campaignForm, setCampaignForm] = useState({ advertiserId: "", title: "", headline: "", summary: "", landingUrl: "", budget: "", placementIds: [] as string[] });

  async function loadData() {
    try {
      const response = await fetch("/schoolbase-admin/api/ads/overview", { credentials: "include", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load ads data.");
      setSummary(data.summary || null);
      setAdvertisers(data.advertisers || []);
      setCampaigns(data.campaigns || []);
      setPlacements(data.placements || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load ads data.";
      setFeedback({ open: true, type: "error", title: "Ads data failed", message });
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(title: string, message: string) {
    playCloseTone();
    setFeedback({ open: true, type: "success", title, message });
  }

  function showError(title: string, message: string, details?: string) {
    setFeedback({ open: true, type: "error", title, message, details });
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  function openDialog(kind: "advertiser" | "campaign") {
    unlockAudio();
    playOpenTone();
    setDialog(kind);
  }

  function closeDialog() {
    if (saving) return;
    playCloseTone();
    setDialog(null);
  }

  async function submitForm(event: React.FormEvent, kind: "advertiser" | "campaign") {
    event.preventDefault();
    setSaving(true);
    const body = kind === "advertiser" ? advertiserForm : {
      ...campaignForm,
      budget: Number(campaignForm.budget || 0),
      placements: campaignForm.placementIds,
    };
    try {
      const response = await fetch(`/schoolbase-admin/api/ads/${kind === "advertiser" ? "advertisers" : "campaigns"}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save.");
      playCloseTone();
      setDialog(null);
      showSuccess(kind === "advertiser" ? "Advertiser created" : "Campaign created", kind === "advertiser" ? "The advertiser was added and is awaiting verification." : "The campaign was saved as a draft. Mark it submitted when it is ready for platform review.");
      setAdvertiserForm({ companyName: "", contactName: "", email: "", category: "" });
      setCampaignForm({ advertiserId: "", title: "", headline: "", summary: "", landingUrl: "", budget: "", placementIds: [] });
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save.";
      showError(kind === "advertiser" ? "Advertiser creation failed" : "Campaign creation failed", message);
    } finally {
      setSaving(false);
    }
  }

  async function updateCampaign(id: string, action: "approve" | "reject" | "pause" | "submit" | "live") {
    setSaving(true);
    try {
      const response = await fetch(`/schoolbase-admin/api/ads/campaigns/${id}/${action === "pause" ? "" : action}`, {
        method: action === "pause" ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: action === "pause" ? JSON.stringify({ status: "PAUSED", enabled: false }) : JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update campaign.");
      const actionLabel = action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "submit" ? "marked submitted" : action === "live" ? "is now live" : "paused";
      showSuccess(`Campaign ${actionLabel}`, action === "live" ? "The campaign is now eligible to appear on its assigned public placement." : `The platform admin action completed successfully.`);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update campaign.";
      showError("Campaign action failed", message);
    } finally {
      setSaving(false);
    }
  }

  async function updateAdvertiser(id: string, action: "verify" | "reject") {
    setSaving(true);
    try {
      const response = await fetch(`/schoolbase-admin/api/ads/advertisers/${id}/${action}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update advertiser.");
      const actionLabel = action === "verify" ? "verified" : "rejected";
      showSuccess(`Advertiser ${actionLabel}`, action === "verify" ? "The advertiser can now have campaigns approved for public delivery." : "The advertiser was marked as rejected.");
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update advertiser.";
      showError("Advertiser action failed", message);
    } finally {
      setSaving(false);
    }
  }

  const overviewCards = useMemo(() => [
    { label: "Active Campaigns", value: summary?.activeCampaigns ?? 0, icon: Activity },
    { label: "Pending Approvals", value: summary?.pendingApprovals ?? 0, icon: BadgeCheck },
    { label: "Monthly Revenue", value: `₦${(summary?.monthlyRevenue ?? 0).toLocaleString()}`, icon: TrendingUp },
    { label: "Impressions", value: (summary?.impressions ?? 0).toLocaleString(), icon: BarChart3 },
    { label: "Clicks", value: (summary?.clicks ?? 0).toLocaleString(), icon: Sparkles },
    { label: "CTR", value: `${((summary?.ctr ?? 0)).toFixed(2)}%`, icon: ShieldCheck },
  ], [summary]);

  return (
    <main className="ads-page min-h-screen bg-background px-2 py-4 text-foreground sm:px-8 sm:py-6 lg:px-12">
      <style>{`.ads-page button:not(:disabled), .ads-page input[type="checkbox"], .ads-page select, .ads-page label { cursor: pointer; } .ads-page button:disabled { cursor: not-allowed; }`}</style>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border border-border bg-surface p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand">
                <Megaphone className="h-4 w-4" /> Ads & Marketplace
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Platform ad foundation</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Premium education-focused placements with manual approval, campaign oversight, and safe public delivery.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => openDialog("advertiser")} className="rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground">New Advertiser</button>
              <button type="button" onClick={() => openDialog("campaign")} className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-hover">New Campaign</button>
            </div>
          </div>
        </header>

        <div className="border border-border bg-surface">
          <div className="flex flex-wrap gap-2 border-b border-border p-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${activeTab === tab ? "bg-brand text-white" : "bg-background text-foreground hover:bg-muted/20"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-6 text-sm text-muted">Loading ads data…</div>
          ) : (
            <div className="space-y-6 p-6">
              {activeTab === "Overview" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {overviewCards.map(({ label, value, icon: Icon }) => (
                      <div key={label} className="border border-border bg-background p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">{label}</p>
                          <Icon className="h-5 w-5 text-brand" />
                        </div>
                        <p className="mt-4 text-2xl font-semibold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="border border-border bg-background p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Building2 className="h-4 w-4 text-brand" /> Advertisers</div>
                      <div className="space-y-2">
                        {advertisers.slice(0, 5).map((advertiser) => (
                          <div key={advertiser.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0">
                            <div>
                              <p className="font-medium text-foreground">{advertiser.companyName}</p>
                              <p className="text-xs text-muted">{advertiser.verificationStatus}</p>
                            </div>
                            <span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-muted">{advertiser.category || "General"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-border bg-background p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><CheckCircle2 className="h-4 w-4 text-brand" /> Latest campaigns</div>
                      <div className="space-y-2">
                        {campaigns.slice(0, 5).map((campaign) => (
                          <div key={campaign.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0">
                            <div>
                              <p className="font-medium text-foreground">{campaign.title}</p>
                              <p className="text-xs text-muted">{campaign.status}</p>
                            </div>
                            <span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-muted">{campaign.advertiser?.companyName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "Advertisers" && (
                <div className="overflow-hidden border border-border bg-background">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-muted/20 text-xs uppercase tracking-[.12em] text-muted">
                      <tr>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advertisers.map((advertiser) => (
                        <tr key={advertiser.id} className="border-t border-border">
                          <td className="px-4 py-3 font-medium text-foreground">{advertiser.companyName}</td>
                          <td className="px-4 py-3 text-muted">{advertiser.contactName}</td>
                          <td className="px-4 py-3 text-muted">{advertiser.category || "General"}</td>
                          <td className="px-4 py-3"><span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-muted">{advertiser.verificationStatus}</span></td>
                          <td className="px-4 py-3"><div className="flex gap-2">{advertiser.verificationStatus !== "VERIFIED" && <button type="button" disabled={saving} onClick={() => void updateAdvertiser(advertiser.id, "verify")} className="rounded-md bg-brand px-2 py-1 text-xs font-semibold text-white">Verify</button>}{advertiser.verificationStatus !== "REJECTED" && <button type="button" disabled={saving} onClick={() => void updateAdvertiser(advertiser.id, "reject")} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground">Reject</button>}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "Campaigns" && (
                <div className="overflow-hidden border border-border bg-background">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-muted/20 text-xs uppercase tracking-[.12em] text-muted">
                      <tr>
                        <th className="px-4 py-3">Campaign</th>
                        <th className="px-4 py-3">Advertiser</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Placement</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id} className="border-t border-border">
                          <td className="px-4 py-3 font-medium text-foreground">{campaign.title}</td>
                          <td className="px-4 py-3 text-muted">{campaign.advertiser?.companyName}</td>
                          <td className="px-4 py-3"><span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-muted">{campaign.status}</span></td>
                          <td className="px-4 py-3 text-muted">{campaign.placements?.map((item: any) => item.placement?.name).join(", ") || "Unassigned"}</td>
                          <td className="px-4 py-3"><div className="flex flex-wrap gap-2">{campaign.status === "DRAFT" && <button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "submit")} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground">Mark submitted</button>}{campaign.status === "APPROVED" && <button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "live")} className="rounded-md bg-brand px-2 py-1 text-xs font-semibold text-white">Go live</button>}{campaign.status === "LIVE" && <button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "pause")} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground">Pause</button>}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "Placements" && (
                <div className="grid gap-4 md:grid-cols-3">
                  {placements.map((placement) => (
                    <div key={placement.id} className="border border-border bg-background p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{placement.name}</p>
                        <span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-muted">{placement.type}</span>
                      </div>
                      <p className="mt-3 text-sm text-muted">{placement.path || "Public placement"}</p>
                      <p className="mt-3 text-xs uppercase tracking-[.12em] text-brand">{placement.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "Approvals" && <div className="border border-border bg-background p-4 text-sm text-muted">Platform admins control this queue. Mark a draft as submitted, then verify, approve, or reject it before public delivery.</div>}

              {activeTab === "Analytics" && <div className="border border-border bg-background p-4 text-sm text-muted">Live placement impressions and clicks are recorded automatically when campaigns render or receive a click.</div>}
            </div>
          )}
        </div>

      </div>

      {activeTab === "Approvals" && !loading && (
        <div className="mx-auto mt-6 max-w-7xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-foreground">Platform review queue</h2><p className="mt-1 text-sm text-muted">Move a draft into review, then approve or reject it before public delivery.</p></div>
            <span className="rounded-full border border-border px-3 py-1 text-xs font-bold uppercase tracking-[.1em] text-muted">{campaigns.filter((campaign) => campaign.status === "SUBMITTED").length} awaiting review</span>
          </div>
          <div className="space-y-3">
            {campaigns.filter((campaign) => campaign.status === "DRAFT" || campaign.status === "SUBMITTED").map((campaign) => (
              <div key={campaign.id} className="flex flex-col gap-3 border border-border bg-background p-4 md:flex-row md:items-center md:justify-between">
                <div><p className="font-semibold text-foreground">{campaign.title}</p><p className="text-sm text-muted">{campaign.advertiser?.companyName} · {campaign.status}</p><p className="mt-1 text-xs text-muted">{campaign.landingUrl}</p></div>
                <div className="flex gap-2">{campaign.status === "DRAFT" ? <button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "submit")} className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white">Mark submitted</button> : <><button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "reject")} className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground">Reject</button><button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "approve")} className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white">Approve</button></>}</div>
              </div>
            ))}
            {campaigns.filter((campaign) => campaign.status === "DRAFT" || campaign.status === "SUBMITTED").length === 0 && <p className="text-sm text-muted">No campaigns are waiting for review.</p>}
          </div>
        </div>
      )}

      {activeTab === "Analytics" && !loading && (
        <div className="mx-auto mt-6 grid max-w-7xl gap-4 md:grid-cols-3">
          {[["Impressions", summary?.impressions ?? 0], ["Clicks", summary?.clicks ?? 0], ["Click-through rate", `${(summary?.ctr ?? 0).toFixed(2)}%`]].map(([label, value]) => <div key={String(label)} className="border border-border bg-surface p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-muted">{label}</p><p className="mt-3 text-2xl font-semibold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p></div>)}
        </div>
      )}

      {dialog && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true"><style>{`@keyframes ads_modal_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }`}</style><div className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]" style={{ animation: "ads_modal_enter 320ms cubic-bezier(.2,.9,.2,1)" }}><div className="flex items-start justify-between gap-4 border-b border-border/70 bg-brand/10 px-4 py-4 sm:px-6 sm:py-5"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-brand"><Megaphone className="h-4 w-4" /> Ads & Marketplace</div><h2 className="mt-2 text-2xl font-bold text-foreground">{dialog === "advertiser" ? "Add advertiser" : "Create campaign"}</h2><p className="mt-1 text-sm text-muted">{dialog === "advertiser" ? "Register a trusted education partner for campaign review." : "Assign a campaign to approved placements for manual review."}</p></div><button type="button" onClick={closeDialog} disabled={saving} aria-label="Close ads dialog" className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-lg transition-colors hover:bg-background disabled:opacity-50"><X className="h-4 w-4" /></button></div><div className="space-y-5 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6"><div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="font-semibold">Manual approval is required.</p><p className="mt-1 leading-6">Only approved education-safe campaigns can appear on public SchoolBase pages.</p></div></div></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-border bg-background p-3"><p className="text-xs text-muted">Audience</p><p className="mt-1 text-sm font-semibold text-foreground">{dialog === "advertiser" ? "Education partner" : "Selected placements"}</p></div><div className="rounded-lg border border-border bg-background p-3"><p className="text-xs text-muted">Review</p><p className="mt-1 text-sm font-semibold text-foreground">Manual</p></div><div className="rounded-lg border border-border bg-background p-3"><p className="text-xs text-muted">Audit</p><p className="mt-1 text-sm font-semibold text-foreground">Recorded</p></div></div><form onSubmit={(event) => void submitForm(event, dialog)} className="space-y-4">{dialog === "advertiser" ? <><input required placeholder="Company name" value={advertiserForm.companyName} onChange={(event) => setAdvertiserForm({ ...advertiserForm, companyName: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm" /><input required placeholder="Contact name" value={advertiserForm.contactName} onChange={(event) => setAdvertiserForm({ ...advertiserForm, contactName: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm" /><input required type="email" placeholder="Email" value={advertiserForm.email} onChange={(event) => setAdvertiserForm({ ...advertiserForm, email: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm" /><input placeholder="Category" value={advertiserForm.category} onChange={(event) => setAdvertiserForm({ ...advertiserForm, category: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm" /></> : <><select required value={campaignForm.advertiserId} onChange={(event) => setCampaignForm({ ...campaignForm, advertiserId: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm"><option value="">Select advertiser</option>{advertisers.map((advertiser) => <option key={advertiser.id} value={advertiser.id}>{advertiser.companyName}</option>)}</select><input required placeholder="Campaign title" value={campaignForm.title} onChange={(event) => setCampaignForm({ ...campaignForm, title: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm" /><input placeholder="Headline" value={campaignForm.headline} onChange={(event) => setCampaignForm({ ...campaignForm, headline: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm" /><textarea placeholder="Summary" value={campaignForm.summary} onChange={(event) => setCampaignForm({ ...campaignForm, summary: event.target.value })} className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-3 text-sm" /><input required type="url" placeholder="Landing URL" value={campaignForm.landingUrl} onChange={(event) => setCampaignForm({ ...campaignForm, landingUrl: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm" /><input type="number" min="0" placeholder="Budget" value={campaignForm.budget} onChange={(event) => setCampaignForm({ ...campaignForm, budget: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm" /><div><p className="mb-2 text-xs font-bold uppercase tracking-[.1em] text-muted">Placements</p><div className="grid gap-2 sm:grid-cols-3">{placements.map((placement) => <label key={placement.id} className="flex items-center gap-2 text-xs text-foreground"><input type="checkbox" checked={campaignForm.placementIds.includes(placement.id)} onChange={(event) => setCampaignForm({ ...campaignForm, placementIds: event.target.checked ? [...campaignForm.placementIds, placement.id] : campaignForm.placementIds.filter((id) => id !== placement.id) })} />{placement.name}</label>)}</div></div></>}<div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={closeDialog} disabled={saving} className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-50">Cancel</button><button disabled={saving} type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50">{saving ? "Saving…" : dialog === "advertiser" ? "Create advertiser" : "Create campaign"}</button></div></form></div></div></div>}
    </main>
  );

      <ErrorModal
        isOpen={feedback.open}
        onClose={() => setFeedback((current) => ({ ...current, open: false }))}
        title={feedback.title}
        message={feedback.message}
        details={feedback.details}
        type={feedback.type}
        confirmLabel={feedback.type === "success" ? "Okay" : "Review"}
      />
}

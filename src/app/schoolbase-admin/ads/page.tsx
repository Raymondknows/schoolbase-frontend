"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BadgeCheck, BarChart3, Building2, CheckCircle2, Eye, Megaphone, ShieldCheck, Sparkles, TrendingUp, X } from "lucide-react";
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

type ReviewTarget = {
  type: "advertiser" | "campaign";
  advertiser?: any;
  campaign?: any;
};

export default function PlatformAdsPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [advertisers, setAdvertisers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"advertiser" | "campaign" | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ open: boolean; type: "success" | "error"; title: string; message: string; details?: string }>({ open: false, type: "success", title: "", message: "" });
  const [advertiserForm, setAdvertiserForm] = useState({ companyName: "", contactName: "", email: "", category: "" });
  const [campaignForm, setCampaignForm] = useState({ advertiserId: "", title: "", headline: "", summary: "", landingUrl: "", budget: "", placementIds: [] as string[] });

  async function loadData(options: { silent?: boolean } = {}) {
    const { silent = false } = options;

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
      if (!silent) {
        setFeedback({ open: true, type: "error", title: "Ads data failed", message });
      }
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(title: string, message: string, details?: string) {
    playCloseTone();
    setFeedback({ open: true, type: "success", title, message, details });
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

  function openReviewModal(nextTarget: ReviewTarget) {
    unlockAudio();
    playOpenTone();
    setReviewTarget(nextTarget);
  }

  function closeReviewModal() {
    playCloseTone();
    setReviewTarget(null);
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
      showSuccess(
        kind === "advertiser" ? "Advertiser created" : "Campaign created",
        kind === "advertiser" ? "The advertiser was added and is awaiting verification." : "The campaign was saved as a draft. Mark it submitted when it is ready for platform review."
      );
      setAdvertiserForm({ companyName: "", contactName: "", email: "", category: "" });
      setCampaignForm({ advertiserId: "", title: "", headline: "", summary: "", landingUrl: "", budget: "", placementIds: [] });
      await loadData({ silent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save.";
      showError(kind === "advertiser" ? "Advertiser creation failed" : "Campaign creation failed", message);
    } finally {
      setSaving(false);
    }
  }

  async function updateCampaign(id: string, action: "approve" | "reject" | "pause" | "resume" | "submit" | "live") {
    setSaving(true);
    try {
      const endpoint = action === "pause" ? "" : action;
      const response = await fetch(`/schoolbase-admin/api/ads/campaigns/${id}/${endpoint}`, {
        method: action === "pause" ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: action === "pause" ? JSON.stringify({ status: "PAUSED", enabled: false }) : JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update campaign.");
      const actionLabel = action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "submit" ? "marked submitted" : action === "live" ? "is now live" : action === "resume" ? "resumed" : "paused";
      showSuccess(`Campaign ${actionLabel}`, action === "live" || action === "resume" ? "The campaign is now eligible to appear on its assigned public placement again." : `The platform admin action completed successfully.`);
      await loadData({ silent: true });
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
      await loadData({ silent: true });
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

  const reviewCampaign = reviewTarget?.campaign ?? reviewTarget?.advertiser?.campaigns?.[0] ?? null;

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
                          <td className="px-4 py-3"><span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-brand">{advertiser.verificationStatus}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {advertiser.verificationStatus !== "VERIFIED" && <button type="button" disabled={saving} onClick={() => void updateAdvertiser(advertiser.id, "verify")} className="rounded-md bg-brand px-2 py-1 text-xs font-semibold text-white">Verify</button>}
                              {advertiser.verificationStatus !== "REJECTED" && <button type="button" disabled={saving} onClick={() => void updateAdvertiser(advertiser.id, "reject")} className="rounded-md border border-brand/30 bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">Reject</button>}
                              <button type="button" onClick={() => openReviewModal({ type: "advertiser", advertiser, campaign: advertiser.campaigns?.[0] ?? null })} className="rounded-md border border-brand/30 bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">View</button>
                            </div>
                          </td>
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
                          <td className="px-4 py-3"><span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-brand">{campaign.status}</span></td>
                          <td className="px-4 py-3 text-muted">{campaign.placements?.map((item: any) => item.placement?.name).join(", ") || "Unassigned"}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => openReviewModal({ type: "campaign", campaign })} className="rounded-md border border-brand/30 bg-brand/10 px-2 py-1 text-xs font-semibold text-brand inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> View</button>
                              {campaign.status === "DRAFT" && <button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "submit")} className="rounded-md border border-brand/30 bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">Mark submitted</button>}
                              {campaign.status === "APPROVED" && <button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "live")} className="rounded-md bg-brand px-2 py-1 text-xs font-semibold text-white">Go live</button>}
                              {campaign.status === "LIVE" && <button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "pause")} className="rounded-md border border-brand/30 bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">Pause</button>}
                              {campaign.status === "PAUSED" && <button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "resume")} className="rounded-md bg-brand px-2 py-1 text-xs font-semibold text-white">Resume</button>}
                            </div>
                          </td>
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
            <div>
              <h2 className="text-lg font-semibold text-foreground">Platform review queue</h2>
              <p className="mt-1 text-sm text-muted">Move a draft into review, then approve or reject it before public delivery.</p>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-xs font-bold uppercase tracking-[.1em] text-muted">{campaigns.filter((campaign) => campaign.status === "SUBMITTED").length} awaiting review</span>
          </div>
          <div className="space-y-3">
            {campaigns.filter((campaign) => campaign.status === "DRAFT" || campaign.status === "SUBMITTED").map((campaign) => (
              <div key={campaign.id} className="flex flex-col gap-3 border border-border bg-background p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{campaign.title}</p>
                  <p className="text-sm text-muted">{campaign.advertiser?.companyName} · {campaign.status}</p>
                  <p className="mt-1 text-xs text-muted">{campaign.landingUrl}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => openReviewModal({ type: "campaign", campaign })} className="rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Review</button>
                  {campaign.status === "DRAFT" ? (
                    <button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "submit")} className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white">Mark submitted</button>
                  ) : (
                    <>
                      <button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "reject")} className="rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand">Reject</button>
                      <button type="button" disabled={saving} onClick={() => void updateCampaign(campaign.id, "approve")} className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white">Approve</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {campaigns.filter((campaign) => campaign.status === "DRAFT" || campaign.status === "SUBMITTED").length === 0 && <p className="text-sm text-muted">No campaigns are waiting for review.</p>}
          </div>
        </div>
      )}

      {activeTab === "Analytics" && !loading && (
        <div className="mx-auto mt-6 grid max-w-7xl gap-4 md:grid-cols-3">
          {["Impressions", "Clicks", "Click-through rate"].map((label) => (
            <div key={label} className="border border-border bg-surface p-5">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {label === "Impressions" ? (summary?.impressions ?? 0).toLocaleString() : label === "Clicks" ? (summary?.clicks ?? 0).toLocaleString() : `${(summary?.ctr ?? 0).toFixed(2)}%`}
              </p>
            </div>
          ))}
        </div>
      )}

      {dialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]">
            <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-brand/10 px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-brand">
                  <Megaphone className="h-4 w-4" /> Ads & Marketplace
                </div>
                <h2 className="mt-2 text-2xl font-bold text-foreground">{dialog === "advertiser" ? "Add advertiser" : "Create campaign"}</h2>
                <p className="mt-1 text-sm text-muted">{dialog === "advertiser" ? "Register a trusted education partner for campaign review." : "Assign a campaign to approved placements for manual review."}</p>
              </div>
              <button type="button" onClick={closeDialog} disabled={saving} aria-label="Close ads dialog" className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-lg transition-colors hover:bg-background disabled:opacity-50"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={(event) => void submitForm(event, dialog)} className="space-y-5 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                  <div>
                    <p className="font-semibold">Manual approval is required.</p>
                    <p className="mt-1 leading-6">Only approved education-safe campaigns can appear on public SchoolBase pages.</p>
                  </div>
                </div>
              </div>

              {dialog === "advertiser" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Company name</span>
                    <input value={advertiserForm.companyName} onChange={(event) => setAdvertiserForm({ ...advertiserForm, companyName: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="SchoolBase Edu Ltd" required />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Contact name</span>
                    <input value={advertiserForm.contactName} onChange={(event) => setAdvertiserForm({ ...advertiserForm, contactName: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Ada Okafor" required />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                    <span>Email</span>
                    <input type="email" value={advertiserForm.email} onChange={(event) => setAdvertiserForm({ ...advertiserForm, email: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="hello@company.com" required />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                    <span>Category</span>
                    <input value={advertiserForm.category} onChange={(event) => setAdvertiserForm({ ...advertiserForm, category: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="EdTech, school supplies, finance..." />
                  </label>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                    <span>Advertiser</span>
                    <select value={campaignForm.advertiserId} onChange={(event) => setCampaignForm({ ...campaignForm, advertiserId: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" required>
                      <option value="">Select advertiser</option>
                      {advertisers.map((advertiser) => (
                        <option key={advertiser.id} value={advertiser.id}>{advertiser.companyName}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                    <span>Campaign title</span>
                    <input value={campaignForm.title} onChange={(event) => setCampaignForm({ ...campaignForm, title: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Admissions Open 2026" required />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                    <span>Headline</span>
                    <input value={campaignForm.headline} onChange={(event) => setCampaignForm({ ...campaignForm, headline: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Future-proof your child’s education" required />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                    <span>Summary</span>
                    <textarea value={campaignForm.summary} onChange={(event) => setCampaignForm({ ...campaignForm, summary: event.target.value })} className="min-h-[110px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Describe the campaign and value proposition." required />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                    <span>Landing URL</span>
                    <input type="url" value={campaignForm.landingUrl} onChange={(event) => setCampaignForm({ ...campaignForm, landingUrl: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="https://example.com" required />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Budget</span>
                    <input type="number" min="0" value={campaignForm.budget} onChange={(event) => setCampaignForm({ ...campaignForm, budget: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="500000" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Placements</span>
                    <select multiple value={campaignForm.placementIds} onChange={(event) => setCampaignForm({ ...campaignForm, placementIds: Array.from(event.target.selectedOptions, (option) => option.value) })} className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                      {placements.map((placement) => (
                        <option key={placement.id} value={placement.id}>{placement.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeDialog} disabled={saving} className="rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : dialog === "advertiser" ? "Add advertiser" : "Create campaign"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewTarget && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 px-3 py-4 sm:px-4">
          <div className="w-full max-w-[1120px] max-h-[calc(100vh-1.5rem)] overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]">
            <div className="flex flex-col gap-4 border-b border-border bg-brand/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand/10">
                  <ShieldCheck className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Application details</p>
                  <h2 className="mt-1 text-2xl font-semibold text-foreground">{reviewTarget.type === "advertiser" ? "Advertiser Review" : "Campaign Review"}</h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-md border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {reviewCampaign?.status || reviewTarget.advertiser?.verificationStatus || "PENDING"}
                </span>
                <button type="button" aria-label="Close review modal" onClick={closeReviewModal} className="rounded-md border border-border bg-surface p-2 text-muted transition hover:bg-background hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid max-h-[calc(100vh-14rem)] gap-0 overflow-y-auto lg:grid-cols-[1.7fr_0.9fr]">
              <div className="min-w-0 px-5 py-4 sm:px-6">
                <div className="space-y-3">
                  <section className="border border-border bg-surface p-5">
                    <p className="mb-4 text-[10px] font-bold uppercase tracking-[.12em] text-muted">Business details</p>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-background p-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Company</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{reviewTarget.advertiser?.companyName || reviewCampaign?.advertiser?.companyName || "—"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Contact</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{reviewTarget.advertiser?.contactName || reviewCampaign?.advertiser?.contactName || "—"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Email</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{reviewTarget.advertiser?.email || reviewCampaign?.advertiser?.email || "—"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Phone</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{reviewTarget.advertiser?.phone || reviewCampaign?.advertiser?.phone || "—"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Website</dt>
                        <dd className="mt-1.5 text-sm font-medium break-all text-foreground">{reviewTarget.advertiser?.website || reviewCampaign?.advertiser?.website || "—"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Category</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{reviewTarget.advertiser?.category || reviewCampaign?.advertiser?.category || "—"}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="border border-border bg-surface p-5">
                    <p className="mb-4 text-[10px] font-bold uppercase tracking-[.12em] text-muted">Campaign details</p>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-background p-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Title</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{reviewCampaign?.title || "—"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Status</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{reviewCampaign?.status || reviewTarget.advertiser?.verificationStatus || "—"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3 sm:col-span-2">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Headline</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{reviewCampaign?.headline || reviewCampaign?.title || "—"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3 sm:col-span-2">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Summary</dt>
                        <dd className="mt-1.5 whitespace-pre-line text-sm font-medium text-foreground">{reviewCampaign?.summary || "—"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3 sm:col-span-2">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Landing URL</dt>
                        <dd className="mt-1.5 break-all text-sm font-medium text-foreground">{reviewCampaign?.landingUrl || "—"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Budget</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{reviewCampaign ? `${(reviewCampaign.budget || 0).toLocaleString()} ${reviewCampaign.currency || "NGN"}` : "—"}</dd>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Review notes</dt>
                        <dd className="mt-1.5 text-sm font-medium text-foreground">{reviewCampaign?.approvalLogs?.[0]?.notes || reviewTarget.advertiser?.notes || "No notes on file."}</dd>
                      </div>
                    </dl>
                  </section>
                </div>
              </div>

              <aside className="border-t border-border bg-background px-5 py-4 lg:border-l lg:border-t-0 lg:border-border lg:px-6">
                <div className="space-y-3">
                  <section className="border border-border bg-surface p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Placement & notes</p>
                    <div className="mt-4 rounded-lg bg-background p-4 text-sm leading-6 text-foreground">
                      <p className="font-medium text-foreground">Requested placements</p>
                      <p className="mt-2">{reviewCampaign?.placements?.map((item: any) => item.placement?.name).join(", ") || "Not specified"}</p>
                    </div>
                  </section>

                  <section className="border border-border bg-surface p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Submission summary</p>
                    <div className="mt-4 space-y-3 text-sm text-foreground">
                      <div className="rounded-lg bg-background p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Submitted by</p>
                        <p className="mt-1.5">{reviewTarget.advertiser?.contactName || reviewCampaign?.advertiser?.contactName || "—"}</p>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Status</p>
                        <p className="mt-1.5">{reviewCampaign?.status || reviewTarget.advertiser?.verificationStatus || "PENDING"}</p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-lg border border-border bg-surface p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Meta</p>
                    <dl className="mt-4 space-y-3 text-sm text-foreground">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Submitted</dt>
                        <dd className="mt-1">{reviewCampaign?.createdAt ? new Date(reviewCampaign.createdAt).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Updated</dt>
                        <dd className="mt-1">{reviewCampaign?.updatedAt ? new Date(reviewCampaign.updatedAt).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</dd>
                      </div>
                    </dl>
                  </section>
                </div>
              </aside>
            </div>

            <div className="sticky bottom-0 border-t border-border bg-background/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {reviewTarget.type === "campaign" && reviewTarget.campaign && (
                    <>
                      {reviewTarget.campaign.status === "DRAFT" ? (
                        <button type="button" disabled={saving} onClick={() => { void updateCampaign(reviewTarget.campaign.id, "submit"); setReviewTarget(null); }} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover">Mark submitted</button>
                      ) : reviewTarget.campaign.status === "PAUSED" ? (
                        <button type="button" disabled={saving} onClick={() => { void updateCampaign(reviewTarget.campaign.id, "resume"); setReviewTarget(null); }} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover">Resume ad</button>
                      ) : (
                        <>
                          <button type="button" disabled={saving} onClick={() => { void updateCampaign(reviewTarget.campaign.id, "reject"); setReviewTarget(null); }} className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface">Reject</button>
                          <button type="button" disabled={saving} onClick={() => { void updateCampaign(reviewTarget.campaign.id, "approve"); setReviewTarget(null); }} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover">Approve</button>
                        </>
                      )}
                    </>
                  )}

                  {reviewTarget.type === "advertiser" && reviewTarget.advertiser && (
                    <>
                      {reviewTarget.advertiser.verificationStatus !== "VERIFIED" && <button type="button" disabled={saving} onClick={() => { void updateAdvertiser(reviewTarget.advertiser.id, "verify"); setReviewTarget(null); }} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover">Verify</button>}
                      {reviewTarget.advertiser.verificationStatus !== "REJECTED" && <button type="button" disabled={saving} onClick={() => { void updateAdvertiser(reviewTarget.advertiser.id, "reject"); setReviewTarget(null); }} className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface">Reject</button>}
                    </>
                  )}
                </div>

                <button type="button" onClick={closeReviewModal} className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ErrorModal
        isOpen={feedback.open}
        onClose={() => setFeedback((current) => ({ ...current, open: false }))}
        title={feedback.title}
        message={feedback.message}
        details={feedback.details}
        type={feedback.type}
        confirmLabel={feedback.type === "success" ? "Okay" : "Review"}
      />
    </main>
  );
}

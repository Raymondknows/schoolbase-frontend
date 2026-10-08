"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Megaphone, RefreshCw } from "lucide-react";

type Sponsor = { id: string; sponsorshipLevel: string; status: string; advertiser: { companyName: string; website: string | null; verificationStatus: string }; _count: { tournaments: number; prizes: number } };

export default function CompetitionSponsorsPage() {
  const [items, setItems] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/schoolbase-admin/api/competition/admin/sponsors", { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error === "FEATURE_DISABLED" ? "Competition sponsors are gated off. Enable only after child-safety, brand-review, and aggregate-reporting controls are ready." : data.error || "Unable to load sponsors.");
      setItems(data.sponsors || []);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load sponsors."); }
    finally { setLoading(false); }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);
  return <main className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12"><header className="flex items-end justify-between gap-3 border border-border bg-surface p-6 sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Competition administration</p><h1 className="mt-2 text-3xl font-semibold text-foreground">Sponsors</h1><p className="mt-2 text-sm text-muted">Competition sponsor relationships reuse verified SchoolBase advertiser records.</p></div><button onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 border border-border px-3 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Refresh</button></header>{error ? <div className="flex items-start gap-2 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status"><CircleAlert className="h-4 w-4 shrink-0" />{error}</div> : null}<section className="border border-border bg-surface"><div className="grid grid-cols-[1.3fr_.7fr_.7fr_.6fr_.6fr] gap-3 border-b border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted"><span>Advertiser</span><span>Verification</span><span>Level</span><span>Events</span><span>Prizes</span></div>{items.length ? items.map((item) => <article key={item.id} className="grid grid-cols-[1.3fr_.7fr_.7fr_.6fr_.6fr] gap-3 border-b border-border px-4 py-4 text-sm last:border-0"><div><p className="font-semibold text-foreground">{item.advertiser.companyName}</p><p className="mt-1 text-xs text-muted">{item.advertiser.website || "No website"}</p></div><span className="text-muted">{item.advertiser.verificationStatus}</span><span className="text-muted">{item.sponsorshipLevel}</span><span className="tabular-nums">{item._count.tournaments}</span><span className="tabular-nums">{item._count.prizes}</span></article>) : !loading && !error ? <div className="p-12 text-center"><Megaphone className="mx-auto h-8 w-8 text-brand" /><p className="mt-3 text-sm font-semibold text-foreground">No Competition sponsors</p><p className="mt-1 text-sm text-muted">Sponsor records remain unavailable while the sponsor capability is off.</p></div> : null}</section><p className="border-l-2 border-brand px-3 py-2 text-xs leading-5 text-muted">Sponsors receive aggregate reports only. This page does not expose student identities, contact details, answer records, or individual results.</p></main>;
}

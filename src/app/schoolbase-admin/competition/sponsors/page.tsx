"use client";

import { useEffect, useState } from "react";
import { Megaphone, RefreshCw } from "lucide-react";
import { ErrorModal } from "@/components/ui/error-modal";
import CompetitionHero from "@/components/competition/competition-hero";
import CompetitionFeatureNotice from "@/components/competition/competition-feature-notice";

type Sponsor = {
  id: string;
  sponsorshipLevel: string;
  status: string;
  advertiser: { companyName: string; website: string | null; verificationStatus: string };
  _count: { tournaments: number; prizes: number };
};

export default function CompetitionSponsorsPage() {
  const [items, setItems] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sponsorsActive, setSponsorsActive] = useState<boolean | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/schoolbase-admin/api/competition/admin/sponsors", { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok && data.error === "FEATURE_DISABLED") {
        setSponsorsActive(false);
        setItems([]);
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || "Unable to load sponsors.");
      }
      setSponsorsActive(true);
      setItems(data.sponsors || []);
    } catch (loadError) {
      setSponsorsActive(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to load sponsors.");
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <CompetitionHero compact eyebrow="Competition administration · Partnerships" title="Sponsors" description="Competition sponsor relationships reuse verified SchoolBase advertiser records."><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 border border-white/60 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Refresh</button></CompetitionHero>

      {sponsorsActive === false ? <CompetitionFeatureNotice title="Competition sponsors aren’t active yet" description="Sponsor administration is currently turned off. Keep this capability disabled until child-safety, brand-review, and aggregate-reporting controls are approved." /> : null}
      {sponsorsActive !== false ? <section className="border border-border bg-surface">
        <div className="grid grid-cols-[1.3fr_.7fr_.7fr_.6fr_.6fr] gap-3 border-b border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted">
          <span>Advertiser</span><span>Verification</span><span>Level</span><span>Events</span><span>Prizes</span>
        </div>
        {items.length ? items.map((item) => (
          <article key={item.id} className="grid grid-cols-[1.3fr_.7fr_.7fr_.6fr_.6fr] gap-3 border-b border-border px-4 py-4 text-sm last:border-0">
            <div>
              <p className="font-semibold text-foreground">{item.advertiser.companyName}</p>
              <p className="mt-1 text-xs text-muted">{item.advertiser.website || "No website"}</p>
            </div>
            <span className="text-muted">{item.advertiser.verificationStatus}</span>
            <span className="text-muted">{item.sponsorshipLevel}</span>
            <span className="tabular-nums">{item._count.tournaments}</span>
            <span className="tabular-nums">{item._count.prizes}</span>
          </article>
        )) : !loading && !error ? (
          <div className="p-12 text-center">
            <Megaphone className="mx-auto h-8 w-8 text-brand" />
            <p className="mt-3 text-sm font-semibold text-foreground">No Competition sponsors</p>
            <p className="mt-1 text-sm text-muted">Sponsor records remain unavailable while the sponsor capability is off.</p>
          </div>
        ) : null}
      </section> : null}
      {sponsorsActive !== false ? <p className="border-l-2 border-brand px-3 py-2 text-xs leading-5 text-muted">Sponsors receive aggregate reports only. This page does not expose student identities, contact details, answer records, or individual results.</p> : null}
      <ErrorModal isOpen={Boolean(error)} onClose={() => setError(null)} title="Competition sponsors could not be loaded" message={error || "Unable to load sponsors."} type="error" confirmLabel="Okay" />
    </main>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type LoginPageAd = {
  id: string;
  title: string;
  headline: string;
  summary: string;
  imageUrl?: string | null;
  landingUrl: string;
  label: string;
  description?: string;
  ctaText?: string;
  advertiser?: string;
};

export function ContextualAdSlot({ path = "/login", compact = false }: { path?: string; compact?: boolean }) {
  const [ad, setAd] = useState<LoginPageAd | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAd() {
      try {
        setLoading(true);
        const response = await fetch(`/api/ads/placements?path=${encodeURIComponent(path)}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({ ads: [] }));
        if (!active) return;
        const nextAd = Array.isArray(data?.ads) && data.ads[0] ? data.ads[0] : null;
        setAd(nextAd);
        if (nextAd) {
          void fetch(`/api/ads/placements?path=${encodeURIComponent(path)}&id=${encodeURIComponent(nextAd.id)}&event=impression`, { method: "POST", keepalive: true }).catch(() => {});
        }
      } catch {
        if (active) setAd(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAd();
    return () => {
      active = false;
    };
  }, [path]);

  if (loading) return null;
  if (!ad) return null;

  const linkTarget = ad.landingUrl.startsWith("http") ? "_blank" : "_self";

  return (
    <div className={`border border-border bg-surface ${compact ? "p-3" : "rounded-xl p-4 shadow-sm"}`}>
      <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
        <span>{ad.label}</span>
        {ad.advertiser ? <span className="text-muted">{ad.advertiser}</span> : null}
      </div>
      <Link
        href={ad.landingUrl}
        target={linkTarget}
        rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
        onClick={() => { void fetch(`/api/ads/placements?path=${encodeURIComponent(path)}&id=${encodeURIComponent(ad.id)}&event=click`, { method: "POST", keepalive: true }).catch(() => {}); }}
        className="group block overflow-hidden rounded-lg border border-border bg-background transition hover:border-brand/40"
      >
        {ad.imageUrl ? (
          <div className="relative h-28 w-full overflow-hidden border-b border-border bg-muted/20">
            <img src={ad.imageUrl} alt={ad.headline || ad.title} className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]" />
          </div>
        ) : null}
        <div className={`space-y-2 ${compact ? "p-3" : "p-4"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">SchoolBase Partner</p>
          <h3 className="text-lg font-semibold text-foreground">{ad.headline || ad.title}</h3>
          <p className="text-sm leading-6 text-muted">{ad.summary || ad.description || "Explore this trusted education resource."}</p>
          <span className="inline-flex items-center text-sm font-semibold text-brand">{ad.ctaText || "Learn more"} →</span>
        </div>
      </Link>
    </div>
  );
}

export function LoginPageAdSlot() {
  return <ContextualAdSlot path="/login" />;
}

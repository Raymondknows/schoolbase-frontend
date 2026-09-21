"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBackendUrl } from "@/lib/backend-url";

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
  const [ads, setAds] = useState<LoginPageAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAds() {
      try {
        setLoading(true);
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/ads/placements?path=${encodeURIComponent(path)}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({ ads: [] }));
        if (!active) return;

        const nextAds = Array.isArray(data?.ads) ? data.ads : [];
        setAds(nextAds);
        setCurrentIndex(0);

        if (nextAds[0]) {
          void fetch(`${backendUrl}/api/ads/placements?path=${encodeURIComponent(path)}&id=${encodeURIComponent(nextAds[0].id)}&event=impression`, { method: "POST", keepalive: true }).catch(() => {});
        }
      } catch {
        if (active) setAds([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAds();
    return () => {
      active = false;
    };
  }, [path]);

  useEffect(() => {
    if (ads.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((previous) => (previous + 1) % ads.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [ads]);

  useEffect(() => {
    if (!ads[currentIndex]) return;
    const ad = ads[currentIndex];
    void fetch(`${getBackendUrl()}/api/ads/placements?path=${encodeURIComponent(path)}&id=${encodeURIComponent(ad.id)}&event=impression`, { method: "POST", keepalive: true }).catch(() => {});
  }, [ads, currentIndex, path]);

  if (loading) return null;

  const ad = ads[currentIndex];
  if (!ad) return null;

  const linkTarget = ad.landingUrl.startsWith("http") ? "_blank" : "_self";

  return (
    <div className={`text-foreground ${compact ? "py-3" : "py-4"}`}>
      <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
        <span>Sponsored</span>
      </div>
      <Link
        href={ad.landingUrl}
        target={linkTarget}
        rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
        onClick={() => { void fetch(`${getBackendUrl()}/api/ads/placements?path=${encodeURIComponent(path)}&id=${encodeURIComponent(ad.id)}&event=click`, { method: "POST", keepalive: true }).catch(() => {}); }}
        className="group block overflow-hidden border-t border-brand/20 pt-3 transition"
      >
        {ad.imageUrl ? (
          <div className="relative h-28 w-full overflow-hidden border-y border-brand/20 bg-transparent">
            <img src={ad.imageUrl} alt={ad.headline || ad.title} className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]" />
          </div>
        ) : null}
        <div className={`space-y-2 ${compact ? "p-3" : "p-4"}`}>
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

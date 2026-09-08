"use client";

import { useCallback, useEffect, useState } from "react";
import countriesJson from "../../config/countries.json";

const COUNTRY_EMOJIS: Record<string, string> = {
  NG: "🇳🇬",
  GH: "🇬🇭",
  SL: "🇸🇱",
  LR: "🇱🇷",
  GM: "🇬🇲",
};

const COUNTRY_ORDER = ["NG", "GH", "SL", "LR", "GM"];

const COUNTRIES = Object.entries((countriesJson as any).countries || {})
  .sort(([a], [b]) => COUNTRY_ORDER.indexOf(a) - COUNTRY_ORDER.indexOf(b))
  .map(([code, config]: [string, any]) => ({
    code,
    name: config.name,
    emoji: COUNTRY_EMOJIS[code] || "🌍",
  }));

export function CountrySelectModal() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialRegion, setInitialRegion] = useState<string | null>(null);
  const [autoConfirmed, setAutoConfirmed] = useState(false);

  useEffect(() => {
    fetch("/api/country/config")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.cookiePresent) {
          setOpen(false);
          return;
        }

        const lang = navigator.language || "";
        const region = lang.split("-")[1]?.toUpperCase() || null;
        const supportedRegion = region && COUNTRIES.some((country) => country.code === region)
          ? region
          : null;
        const initial = supportedRegion ?? COUNTRIES[0].code;

        setSelected(initial);
        setInitialRegion(supportedRegion);
        setOpen(true);
      })
      .catch(() => {
        setSelected(COUNTRIES[0].code);
        setOpen(true);
      });
  }, []);

  const confirm = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/country/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: selected }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${res.status}`;
        throw new Error(`Failed to set country: ${errorMessage}`);
      }
      
      setOpen(false);
      window.location.reload();
    } catch (err) {
      console.error("Country selection error:", {
        error: err instanceof Error ? err.message : String(err),
        selected,
        timestamp: new Date().toISOString(),
      });
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    if (!open || !initialRegion || autoConfirmed || loading) return;
    confirm();
    setAutoConfirmed(true);
  }, [confirm, initialRegion, open, autoConfirmed, loading]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-4">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-slate-200 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
              Country selection
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
              Select your country.
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Choose your country so we can personalize your pricing, currency, and onboarding experience.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {COUNTRIES.map((country) => {
            const active = selected === country.code;
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => setSelected(country.code)}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40 ${
                  active
                    ? "border-brand bg-brand/5 shadow-sm"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                  {country.emoji}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{country.name}</p>
                  <p className="text-xs text-slate-500">{country.code}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            You can change this later if needed. Local pricing will update after confirmation.
          </p>
          <button
            type="button"
            onClick={confirm}
            disabled={loading}
            className="inline-flex w-full justify-center rounded-3xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CountrySelectModal;

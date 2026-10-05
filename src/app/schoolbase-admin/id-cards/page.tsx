"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, CreditCard, FileText, Layers3, ShieldCheck, Sparkles, TrendingUp, WalletCards } from "lucide-react";

function formatMinorCurrency(amount: number, currency = "NGN") {
  const safeCurrency = /^[A-Z]{3}$/.test(currency) ? currency : "NGN";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: safeCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round((Number.isFinite(amount) ? amount : 0) / 100));
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

export default function SchoolbaseAdminIdCardsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [overviewRes, awardsRes] = await Promise.all([
          fetch("/schoolbase-admin/api/id-cards/overview", { credentials: "include" }),
          fetch("/schoolbase-admin/api/id-cards/awards", { credentials: "include" }),
        ]);

        if (!overviewRes.ok || !awardsRes.ok) {
          throw new Error("Unable to load ID-card dashboard data.");
        }

        const [overviewData, awardsData] = await Promise.all([
          overviewRes.json(),
          awardsRes.json(),
        ]);

        if (!active) return;
        setOverview(overviewData);
        setAwards(awardsData?.awards || []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load ID-card dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const metricsData = overview?.metrics || {};
    const revenue = Object.entries(metricsData.revenueByCurrency || {}).map(([currency, amount]) => ({
      currency,
      total: Number(amount || 0),
    }));

    return [
      { label: "Orders", value: String(metricsData.orders ?? 0), detail: "Created in range", icon: FileText },
      { label: "Awaiting payment", value: String(metricsData.awaitingPayment ?? 0), detail: "Not yet verified", icon: CreditCard },
      { label: "Paid", value: String(metricsData.paid ?? 0), detail: "Confirmed by provider", icon: BadgeDollarSign },
      { label: "Ready", value: String(metricsData.ready ?? 0), detail: "Generated and packaged", icon: ShieldCheck },
      { label: "Revenue", value: revenue.length ? revenue.map((entry) => `${entry.currency} ${formatMinorCurrency(entry.total, entry.currency)}`).join(" · ") : "NGN ₦0", detail: "Paid collection by currency", icon: TrendingUp },
      { label: "Free award units", value: String(metricsData.freeAwardUnitsGranted ?? 0), detail: "Granted to schools", icon: Sparkles },
    ];
  }, [overview]);

  const orders: any[] = overview?.orders || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12 [&_button:not(:disabled)]:cursor-pointer [&_a]:cursor-pointer">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ID Card Studio</h1>
          <p className="mt-2 text-muted">Track usage, payments, revenue, and free awards across schools.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/schoolbase-admin" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light">
            Back to overview
          </Link>
        </div>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="flex items-start gap-4 border border-border bg-surface p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand/10 text-brand">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted">{label}</p>
              <p className="mt-1.5 break-words text-xl font-bold text-foreground">{value}</p>
              <p className="mt-1 text-xs text-muted">{detail}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-foreground">Recent orders</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-14 animate-pulse bg-muted/10" />
                ))}
              </div>
            ) : orders.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="px-3 py-2 font-medium">School</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Cards</th>
                      <th className="px-3 py-2 font-medium">Amount</th>
                      <th className="px-3 py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 8).map((order: any) => (
                      <tr key={order.id} className="border-b border-border last:border-b-0">
                        <td className="px-3 py-3 font-medium text-foreground">{order.schoolName || order.schoolId}</td>
                        <td className="px-3 py-3"><span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-medium text-brand">{order.status}</span></td>
                        <td className="px-3 py-3 text-muted">{order.quantity}</td>
                        <td className="px-3 py-3 text-muted">{formatMinorCurrency(order.amountMinor, order.currency)}</td>
                        <td className="px-3 py-3 text-muted">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted">No card orders have been tracked yet.</p>
            )}
        </section>

        <section className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-foreground">Free awards</h2>
            </div>

            {awards.length ? (
              <div className="divide-y divide-border">
                {awards.slice(0, 5).map((award: any) => (
                  <div key={award.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{award.schoolName || award.schoolId}</p>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{award.status}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted">{award.awardType} · {award.reasonCategory}</p>
                    <p className="mt-1 text-sm font-medium text-brand">{award.unitsGranted || award.valueMinor ? `${award.unitsGranted || formatMinorCurrency(award.valueMinor, award.currency)} ${award.awardType === "UNITS" ? "cards" : "credit"}` : "No balance"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No free usage awards have been issued.</p>
            )}
        </section>
      </div>
    </div>
  );
}

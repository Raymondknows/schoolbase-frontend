"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, CreditCard, Download, FileText, Layers3, Search, ShieldCheck, Sparkles, TrendingUp, WalletCards } from "lucide-react";

function formatMinorCurrency(amount: number, currency?: string | null) {
  const safeCurrency = /^[A-Z]{3}$/.test(currency ?? "") ? currency ?? "NGN" : "NGN";
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

type OrderSummary = {
  id: string;
  schoolName?: string | null;
  schoolId?: string | null;
  status: string;
  paymentStatus?: string | null;
  quantity: number;
  amountMinor: number;
  currency?: string | null;
  createdAt?: string | null;
  templateId?: string | null;
  templateTier?: string | null;
};

type AwardSummary = {
  id: string;
  schoolName?: string | null;
  schoolId?: string | null;
  status: string;
  awardType: string;
  reasonCategory: string;
  unitsGranted?: number | null;
  valueMinor?: number | null;
  currency?: string | null;
};

type OverviewMetrics = {
  orders?: number;
  awaitingPayment?: number;
  paid?: number;
  ready?: number;
  freeAwardUnitsGranted?: number;
  revenueByCurrency?: Record<string, number>;
};

type OverviewData = {
  metrics?: OverviewMetrics;
  rangeDays?: number;
  orders?: OrderSummary[];
};

export default function SchoolbaseAdminIdCardsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [awards, setAwards] = useState<AwardSummary[]>([]);
  const [rangeDays, setRangeDays] = useState(30);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [overviewRes, awardsRes] = await Promise.all([
          fetch(`/schoolbase-admin/api/id-cards/overview?days=${rangeDays}`, { credentials: "include" }),
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
  }, [rangeDays]);

  const metrics = useMemo(() => {
    const metricsData = overview?.metrics || {};
    const revenue = Object.entries(metricsData.revenueByCurrency || {}).map(([currency, amount]) => ({
      currency,
      total: Number(amount || 0),
    }));

    return [
      { label: "Orders", value: String(metricsData.orders ?? 0), detail: `Created in last ${overview?.rangeDays || rangeDays} days`, icon: FileText },
      { label: "Awaiting payment", value: String(metricsData.awaitingPayment ?? 0), detail: "Not yet verified", icon: CreditCard },
      { label: "Paid", value: String(metricsData.paid ?? 0), detail: "Confirmed by provider", icon: BadgeDollarSign },
      { label: "Ready", value: String(metricsData.ready ?? 0), detail: "Generated and packaged", icon: ShieldCheck },
      { label: "Revenue", value: revenue.length ? revenue.map((entry) => `${entry.currency} ${formatMinorCurrency(entry.total, entry.currency)}`).join(" · ") : "NGN ₦0", detail: "Paid collection by currency", icon: TrendingUp },
      { label: "Free award units", value: String(metricsData.freeAwardUnitsGranted ?? 0), detail: "Granted to schools", icon: Sparkles },
    ];
  }, [overview, rangeDays]);

  const orders: OrderSummary[] = overview?.orders || [];
  const filteredOrders = orders.filter((order) => {
    const matchesSchool = !schoolSearch.trim() || String(order.schoolName || order.schoolId).toLowerCase().includes(schoolSearch.trim().toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter || order.paymentStatus === statusFilter;
    return matchesSchool && matchesStatus;
  });

  const exportOrders = () => {
    const columns = ["school_name", "school_id", "order_id", "order_status", "payment_status", "cards", "template", "template_tier", "currency", "amount_minor", "created_at"];
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = filteredOrders.map((order) => [order.schoolName, order.schoolId, order.id, order.status, order.paymentStatus, order.quantity, order.templateId, order.templateTier, order.currency, order.amountMinor, order.createdAt]);
    const csv = [columns, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `id-card-orders-${rangeDays}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 overflow-hidden px-2 py-6 sm:px-8 sm:py-8 lg:px-12 [&_button:not(:disabled)]:cursor-pointer [&_a]:cursor-pointer">
      <style>{`@keyframes support-page-pulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgb(10 102 194 / .4) } 50% { opacity: .55; box-shadow: 0 0 0 7px rgb(10 102 194 / 0) } } @keyframes support-page-scan { from { transform: translateX(-100%) } to { transform: translateX(100%) } } .support-page-hero { position: relative; overflow: hidden; } .support-page-scan { position: absolute; inset: 0 auto 0 0; width: 33%; background: linear-gradient(to right, transparent, rgb(10 102 194 / .10), transparent); animation: support-page-scan 3.2s linear infinite; pointer-events: none; } .support-page-pulse { animation: support-page-pulse 0.9s ease-in-out infinite; }`}</style>

      <header className="support-page-hero relative overflow-hidden border border-border bg-surface px-6 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
        <div className="support-page-scan" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand">
              <span className="support-page-pulse h-2.5 w-2.5 rounded-full bg-brand" />
              Card operations
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">ID Card Studio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Track usage, payments, revenue, and free awards across schools.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex min-w-0 items-center gap-2 text-sm font-medium text-muted">Range
              <select value={rangeDays} onChange={(event) => { setLoading(true); setRangeDays(Number(event.target.value)); }} className="h-10 border border-border bg-surface px-2 text-foreground">
                <option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={365}>365 days</option>
              </select>
            </label>
            <Link href="/schoolbase-admin/id-cards/pricing" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover">
              <BadgeDollarSign className="h-4 w-4" />
              Pricing
            </Link>
            <Link href="/schoolbase-admin/id-cards/awards" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light">
              <Sparkles className="h-4 w-4" />
              Awards
            </Link>
            <Link href="/schoolbase-admin" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light">
              Back to overview
            </Link>
          </div>
        </div>
      </header>

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

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="min-w-0 overflow-hidden border border-border bg-surface p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Layers3 className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-foreground">Recent orders</h2>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <label className="flex h-9 min-w-0 flex-1 items-center gap-2 border border-border px-2 sm:flex-none">
                <Search className="h-4 w-4 text-muted" />
                <input value={schoolSearch} onChange={(event) => setSchoolSearch(event.target.value)} aria-label="Filter orders by school" placeholder="Filter schools" className="w-full min-w-0 bg-transparent text-sm outline-none sm:w-32" />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter orders by status" className="h-9 min-w-[150px] border border-border bg-background px-2 text-sm text-foreground">
                <option value="">All states</option><option value="PAYMENT_PENDING">Payment pending</option><option value="PAID">Paid</option><option value="GENERATING">Generating</option><option value="READY">Ready</option><option value="GENERATION_FAILED">Generation failed</option>
              </select>
              <button type="button" onClick={exportOrders} disabled={!filteredOrders.length} className="inline-flex h-9 items-center gap-2 border border-border px-3 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><Download className="h-4 w-4" /> CSV</button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse bg-muted/10" />)}</div>
          ) : filteredOrders.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[620px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-3 py-2 font-medium">School</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Cards</th><th className="px-3 py-2 font-medium">Amount</th><th className="px-3 py-2 font-medium">Date</th><th className="px-3 py-2 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.slice(0, 250).map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-3 font-medium text-foreground">{order.schoolName || order.schoolId}</td>
                      <td className="px-3 py-3"><span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-medium text-brand">{order.status}</span></td>
                      <td className="px-3 py-3 text-muted">{order.quantity}</td>
                      <td className="px-3 py-3 text-muted">{formatMinorCurrency(order.amountMinor, order.currency ?? "NGN")}</td>
                      <td className="px-3 py-3 text-muted">{formatDate(order.createdAt)}</td>
                      <td className="px-3 py-3"><Link href={`/schoolbase-admin/id-cards/orders/${encodeURIComponent(order.id)}`} className="font-semibold text-brand hover:underline">Timeline</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length > 250 ? <p className="mt-3 text-xs text-muted">Showing 250 records. Narrow the date range or filters for export.</p> : null}
            </div>
          ) : <p className="text-sm text-muted">{orders.length ? "No orders match these filters." : "No card orders have been tracked yet."}</p>}
        </section>

        <section className="min-w-0 overflow-hidden border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-foreground">Free awards</h2>
            </div>

            {awards.length ? (
              <div className="divide-y divide-border">
                {awards.slice(0, 5).map((award) => (
                  <div key={award.id} className="min-w-0 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className="min-w-0 break-words font-semibold text-foreground">{award.schoolName || award.schoolId}</p>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{award.status}</span>
                    </div>
                    <p className="mt-2 break-words text-xs text-muted">{award.awardType} · {award.reasonCategory}</p>
                    <p className="mt-1 break-words text-sm font-medium text-brand">{award.unitsGranted ?? award.valueMinor ?? 0 ? `${award.unitsGranted ?? formatMinorCurrency(award.valueMinor ?? 0, award.currency ?? "NGN")} ${award.awardType === "UNITS" ? "cards" : "credit"}` : "No balance"}</p>
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

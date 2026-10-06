"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, CreditCard, Download, FileText, Layers3, Search, ShieldCheck, Sparkles, TrendingUp, WalletCards } from "lucide-react";

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

  const orders: any[] = overview?.orders || [];
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
    <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12 [&_button:not(:disabled)]:cursor-pointer [&_a]:cursor-pointer">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ID Card Studio</h1>
          <p className="mt-2 text-muted">Track usage, payments, revenue, and free awards across schools.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-muted">Range
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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-foreground">Recent orders</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex h-9 items-center gap-2 border border-border px-2">
                <Search className="h-4 w-4 text-muted" />
                <input value={schoolSearch} onChange={(event) => setSchoolSearch(event.target.value)} aria-label="Filter orders by school" placeholder="Filter schools" className="w-32 bg-transparent text-sm outline-none" />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter orders by status" className="h-9 border border-border bg-background px-2 text-sm text-foreground">
                <option value="">All states</option><option value="PAYMENT_PENDING">Payment pending</option><option value="PAID">Paid</option><option value="GENERATING">Generating</option><option value="READY">Ready</option><option value="GENERATION_FAILED">Generation failed</option>
              </select>
              <button type="button" onClick={exportOrders} disabled={!filteredOrders.length} className="inline-flex h-9 items-center gap-2 border border-border px-3 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><Download className="h-4 w-4" /> CSV</button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse bg-muted/10" />)}</div>
          ) : filteredOrders.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-3 py-2 font-medium">School</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Cards</th><th className="px-3 py-2 font-medium">Amount</th><th className="px-3 py-2 font-medium">Date</th><th className="px-3 py-2 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.slice(0, 250).map((order: any) => (
                    <tr key={order.id} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-3 font-medium text-foreground">{order.schoolName || order.schoolId}</td>
                      <td className="px-3 py-3"><span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-medium text-brand">{order.status}</span></td>
                      <td className="px-3 py-3 text-muted">{order.quantity}</td>
                      <td className="px-3 py-3 text-muted">{formatMinorCurrency(order.amountMinor, order.currency)}</td>
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

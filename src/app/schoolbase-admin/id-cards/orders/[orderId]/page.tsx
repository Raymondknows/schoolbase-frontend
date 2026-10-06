"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, FileText } from "lucide-react";

type OrderEvent = { eventType: string; actorId: string | null; createdAt: string };
type AdminOrder = {
  id: string;
  schoolId: string;
  schoolName: string;
  status: string;
  paymentStatus: string;
  currency: string;
  amountMinor: number;
  providerReference: string | null;
  providerTransactionId: string | null;
  artifactAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  quantity: number;
  templateId: string;
  templateTier: string;
  pricingRuleVersion: number;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  quoteExpiresAt: string;
  events: OrderEvent[];
};

function formatMoney(minor: number, currency: string) {
  const safeCurrency = /^[A-Z]{3}$/.test(currency) ? currency : "NGN";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: safeCurrency, maximumFractionDigits: 0 }).format(minor / 100);
}

export default function SchoolbaseAdminIdCardOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/schoolbase-admin/api/id-cards/orders/${encodeURIComponent(orderId)}`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Unable to load this order.");
        if (active) setOrder(data.order);
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load this order."); });
    return () => { active = false; };
  }, [orderId]);

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-5xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
        <Link href="/schoolbase-admin/id-cards" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"><ArrowLeft className="h-4 w-4" /> ID Card operations</Link>
        {error ? <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
        {order ? <>
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{order.schoolName} · {order.schoolId}</p>
            <h1 className="mt-1 break-all text-2xl font-bold text-foreground">Order {order.id}</h1>
          </header>
          <section className="border border-border bg-surface p-5">
            <h2 className="font-semibold text-foreground">Order snapshot</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="text-xs text-muted">Order state</dt><dd className="mt-1 font-semibold text-foreground">{order.status}</dd></div>
              <div><dt className="text-xs text-muted">Payment state</dt><dd className="mt-1 font-semibold text-foreground">{order.paymentStatus}</dd></div>
              <div><dt className="text-xs text-muted">Cards</dt><dd className="mt-1 font-semibold text-foreground">{order.quantity}</dd></div>
              <div><dt className="text-xs text-muted">Design</dt><dd className="mt-1 font-semibold text-foreground">{order.templateId} · {order.templateTier}</dd></div>
              <div><dt className="text-xs text-muted">Pricing version</dt><dd className="mt-1 font-semibold text-foreground">{order.pricingRuleVersion}</dd></div>
              <div><dt className="text-xs text-muted">Amount</dt><dd className="mt-1 font-semibold text-foreground">{formatMoney(order.amountMinor, order.currency)}</dd></div>
              <div><dt className="text-xs text-muted">Subtotal</dt><dd className="mt-1 text-foreground">{formatMoney(order.subtotalMinor, order.currency)}</dd></div>
              <div><dt className="text-xs text-muted">Discount</dt><dd className="mt-1 text-foreground">{formatMoney(order.discountMinor, order.currency)}</dd></div>
              <div><dt className="text-xs text-muted">Tax</dt><dd className="mt-1 text-foreground">{formatMoney(order.taxMinor, order.currency)}</dd></div>
              <div><dt className="text-xs text-muted">Provider reference</dt><dd className="mt-1 break-all text-foreground">{order.providerReference || "—"}</dd></div>
              <div><dt className="text-xs text-muted">Provider transaction</dt><dd className="mt-1 break-all text-foreground">{order.providerTransactionId || "—"}</dd></div>
              <div><dt className="text-xs text-muted">Artifact</dt><dd className="mt-1 text-foreground">{order.artifactAvailable ? "Generated" : "Not available"}</dd></div>
              <div><dt className="text-xs text-muted">Created</dt><dd className="mt-1 text-foreground">{new Date(order.createdAt).toLocaleString()}</dd></div>
            </dl>
            <p className="mt-5 border-t border-border pt-4 text-xs text-muted">Student names, admission numbers, photos, and card files are deliberately excluded from this platform operations view.</p>
          </section>
          <section className="border border-border bg-surface p-5">
            <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-brand" /><h2 className="font-semibold text-foreground">Order event timeline</h2></div>
            {order.events.length ? <ol className="mt-4 divide-y divide-border">{order.events.map((event, index) => <li key={`${event.eventType}-${event.createdAt}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"><span className="inline-flex items-center gap-2 font-medium text-foreground"><FileText className="h-4 w-4 text-muted" />{event.eventType.replace(/_/g, " ")}</span><span className="text-xs text-muted">{new Date(event.createdAt).toLocaleString()}{event.actorId ? ` · Actor ${event.actorId}` : ""}</span></li>)}</ol> : <p className="mt-4 text-sm text-muted">No order events recorded.</p>}
          </section>
        </> : !error ? <p className="border border-border bg-surface p-5 text-sm text-muted">Loading order details…</p> : null}
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Download, LoaderCircle, RotateCw, WalletCards } from "lucide-react";

type OrderSummary = {
  id: string;
  status: string;
  paymentStatus: string;
  amountMinor: number;
  currency: string;
  quantity: number;
  templateId: string;
  templateTier: string;
};
type CardIssuance = {
  id: string;
  pupilId: string;
  pupilName: string;
  admissionNo?: string | null;
  className?: string | null;
  status: string;
  issuedAt?: string | null;
  expiresAt?: string | null;
  supersedesId?: string | null;
  reason?: string | null;
  replacement?: { id: string; status: string; orderId: string; createdAt: string } | null;
};
type ReadyOrder = { id: string; createdAt: string; quantity: number };

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Unable to retrieve order status.");
  return data as T;
}

function formatMinorCurrency(amount: number, currency: string) {
  const safeCurrency = /^[A-Z]{3}$/.test(currency) ? currency : "NGN";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: safeCurrency, maximumFractionDigits: 0 }).format(Math.round(amount / 100));
}

export default function IdCardOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [issuances, setIssuances] = useState<CardIssuance[]>([]);
  const [readyOrders, setReadyOrders] = useState<ReadyOrder[]>([]);
  const [issuanceReasons, setIssuanceReasons] = useState<Record<string, string>>({});
  const [replacementOrders, setReplacementOrders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshOrder = async (verifyPayment: boolean) => {
    const { order: current } = await requestJson<{ order: OrderSummary }>(`/api/id-cards/orders/${encodeURIComponent(orderId)}`);
    if (verifyPayment && current.paymentStatus !== "PAID") {
      const result = await requestJson<{ order: OrderSummary }>(`/api/id-cards/orders/${encodeURIComponent(orderId)}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setOrder(result.order);
      return;
    }
    setOrder(current);
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { order: current } = await requestJson<{ order: OrderSummary }>(`/api/id-cards/orders/${encodeURIComponent(orderId)}`);
        if (!active) return;
        setOrder(current);
        if (current.paymentStatus !== "PAID") {
          try {
            const result = await requestJson<{ order: OrderSummary }>(`/api/id-cards/orders/${encodeURIComponent(orderId)}/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            });
            if (active) setOrder(result.order);
          } catch (verificationError) {
            if (active) setError(verificationError instanceof Error ? verificationError.message : "Payment is not yet confirmed.");
          }
        }
        if (current.status === "READY" && current.paymentStatus === "PAID" && active) {
          const [{ issuances: cardIssuances }, { orders: paidOrders }] = await Promise.all([
            requestJson<{ issuances: CardIssuance[] }>(`/api/id-cards/orders/${encodeURIComponent(orderId)}/issuances`),
            requestJson<{ orders: Array<ReadyOrder & { status: string; paymentStatus: string }> }>("/api/id-cards/orders"),
          ]);
          if (active) setIssuances(cardIssuances || []);
          if (active) setReadyOrders(paidOrders.filter((candidate) => candidate.status === "READY" && candidate.paymentStatus === "PAID"));
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to retrieve order status.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [orderId]);

  const updateIssuance = async (issuanceId: string, action: "ISSUE" | "REPLACE" | "REVOKE") => {
    const reason = (issuanceReasons[issuanceId] || "").trim();
    if (reason.length < 8) {
      setError("Enter a reason of at least 8 characters before changing card status.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      await requestJson(`/api/id-cards/issuances/${encodeURIComponent(issuanceId)}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, replacementOrderId: action === "REPLACE" ? replacementOrders[issuanceId] : undefined }),
      });
      const { issuances: updated } = await requestJson<{ issuances: CardIssuance[] }>(`/api/id-cards/orders/${encodeURIComponent(orderId)}/issuances`);
      setIssuances(updated || []);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update issuance status.");
    } finally {
      setWorking(false);
    }
  };

  const retryGeneration = async () => {
    setWorking(true);
    setError(null);
    try {
      const result = await requestJson<{ order: OrderSummary }>(`/api/id-cards/orders/${encodeURIComponent(orderId)}/retry-generation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setOrder((current) => current ? { ...current, ...result.order } : result.order);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Generation retry failed.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-4xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
        <div>
          <Link href="/admin/id-cards" className="text-sm font-semibold text-brand hover:text-brand-hover">ID Card Studio</Link>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Order status</h1>
          <p className="mt-2 text-muted">Payment is independently verified before production files are generated.</p>
        </div>

        {error ? <div role="alert" className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{error}</div> : null}

        <section className="border border-border bg-surface p-5 sm:p-6">
          {loading ? (
            <div className="flex items-center gap-3 py-8 text-sm text-muted"><LoaderCircle className="h-5 w-5 animate-spin" /> Checking payment and order status…</div>
          ) : order ? (
            <>
              <div className="flex items-start gap-4 border-b border-border pb-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-brand/10 text-brand">
                  {order.status === "READY" && order.paymentStatus === "PAID" ? <CheckCircle2 className="h-5 w-5" /> : <WalletCards className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-foreground">{order.status === "READY" ? "Cards are ready" : order.paymentStatus === "PAID" ? "Payment confirmed" : "Payment pending"}</h2>
                  <p className="mt-1 break-all text-xs text-muted">Order {order.id}</p>
                </div>
              </div>
              <dl className="grid gap-4 border-b border-border py-5 sm:grid-cols-2">
                <div><dt className="text-xs text-muted">Payment</dt><dd className="mt-1 font-semibold text-foreground">{order.paymentStatus}</dd></div>
                <div><dt className="text-xs text-muted">Production status</dt><dd className="mt-1 font-semibold text-foreground">{order.status}</dd></div>
                <div><dt className="text-xs text-muted">Cards</dt><dd className="mt-1 font-semibold text-foreground">{order.quantity}</dd></div>
                <div><dt className="text-xs text-muted">Amount</dt><dd className="mt-1 font-semibold text-foreground">{formatMinorCurrency(order.amountMinor, order.currency)}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-3 pt-5">
                {order.status === "READY" && order.paymentStatus === "PAID" ? (
                  <>
                    <a href={`/api/id-cards/orders/${encodeURIComponent(order.id)}/download?format=CR80`} className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"><Download className="h-4 w-4" /> CR80 card pages</a>
                    <a href={`/api/id-cards/orders/${encodeURIComponent(order.id)}/download?format=A4`} className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light"><Download className="h-4 w-4" /> A4 cut sheet</a>
                  </>
                ) : null}
                {order.status === "GENERATION_FAILED" && order.paymentStatus === "PAID" ? (
                  <button type="button" onClick={retryGeneration} disabled={working} className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"><RotateCw className="h-4 w-4" /> {working ? "Retrying…" : "Retry generation"}</button>
                ) : null}
                <button type="button" onClick={() => { setError(null); setWorking(true); refreshOrder(true).catch((refreshError) => setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh order status.")).finally(() => setWorking(false)); }} disabled={working} className="border border-border px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50">Refresh status</button>
                <Link href="/admin/id-cards" className="border border-border px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light">Return to ID Card Studio</Link>
              </div>
            </>
          ) : <p className="py-8 text-sm text-muted">Order information is unavailable.</p>}
        </section>

        {order?.status === "READY" && order.paymentStatus === "PAID" ? (
          <section className="border border-border bg-surface p-5">
            <h2 className="font-semibold text-foreground">Student card issue register</h2>
            <p className="mt-1 text-sm text-muted">Record when a physical card is issued, replaced or revoked. These are school records; SchoolBase does not know whether a card was physically printed or handed over.</p>
            <div className="mt-4 divide-y divide-border">
              {issuances.map((issuance) => (
                <article key={issuance.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{issuance.pupilName}</p>
                      <p className="mt-0.5 text-xs text-muted">{issuance.admissionNo || "No admission number"} · {issuance.className || "No class"}</p>
                      <p className="mt-1 text-xs text-muted">Status: <span className="font-semibold text-foreground">{issuance.status}</span>{issuance.issuedAt ? ` · Issued ${new Date(issuance.issuedAt).toLocaleDateString()}` : ""}</p>
                      {issuance.reason ? <p className="mt-1 text-xs text-muted">Reason: {issuance.reason}</p> : null}
                      {issuance.replacement ? <p className="mt-1 text-xs text-emerald-700">Replaced by issuance {issuance.replacement.id.slice(0, 10)}</p> : null}
                    </div>
                    {(["GENERATED", "ISSUED"].includes(issuance.status)) ? (
                      <div className="grid gap-2 sm:w-[380px]">
                        <label className="text-xs font-semibold text-foreground">Reason for status change
                          <input value={issuanceReasons[issuance.id] || ""} onChange={(event) => setIssuanceReasons((current) => ({ ...current, [issuance.id]: event.target.value }))} minLength={8} placeholder="For example: handed to student, replacement issued" className="mt-1 h-9 w-full border border-border bg-background px-2 text-sm font-normal" />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {issuance.status === "GENERATED" ? <button type="button" onClick={() => updateIssuance(issuance.id, "ISSUE")} disabled={working} className="border border-border px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-light disabled:opacity-50">Mark issued</button> : null}
                          <button type="button" onClick={() => updateIssuance(issuance.id, "REVOKE")} disabled={working} className="border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Revoke</button>
                        </div>
                        <label className="text-xs font-semibold text-foreground">Replacement order (select the paid, ready order with this student)
                          <select value={replacementOrders[issuance.id] || ""} onChange={(event) => setReplacementOrders((current) => ({ ...current, [issuance.id]: event.target.value }))} className="mt-1 h-9 w-full border border-border bg-background px-2 text-sm font-normal">
                            <option value="">Choose replacement order</option>
                            {readyOrders.filter((candidate) => candidate.id !== orderId).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.id.slice(0, 12)} · {candidate.quantity} cards · {new Date(candidate.createdAt).toLocaleDateString()}</option>)}
                          </select>
                        </label>
                        {replacementOrders[issuance.id] ? <button type="button" onClick={() => updateIssuance(issuance.id, "REPLACE")} disabled={working} className="justify-self-start border border-border px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-light disabled:opacity-50">Link selected replacement</button> : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
              {!issuances.length ? <p className="py-4 text-sm text-muted">No student issue records were returned for this order.</p> : null}
            </div>
          </section>
        ) : null}

        <section className="border border-border bg-surface p-5">
          <h2 className="font-semibold text-foreground">Print settings</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Print at 100% / Actual size. Turn off “Fit to page” or “Shrink oversized pages.”</li>
            <li>CR80 card pages are exact-size individual fronts and optional backs.</li>
            <li>A4 cut sheets keep each card at CR80 size. Cut along the trim marks.</li>
            <li>Check one test page with a ruler before printing the full batch.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

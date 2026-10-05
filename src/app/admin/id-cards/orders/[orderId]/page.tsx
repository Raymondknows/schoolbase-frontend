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
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to retrieve order status.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [orderId]);

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
                  <a href={`/api/id-cards/orders/${encodeURIComponent(order.id)}/download`} className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"><Download className="h-4 w-4" /> Download card PDF</a>
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
      </div>
    </main>
  );
}

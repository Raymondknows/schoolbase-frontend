"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditCard, AlertCircle, Eye, Search, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { getBackendUrl } from "@/lib/backend-url";
import ParentPageShell from "@/components/parent-page-shell";
import { useEffectiveCurrency, useParentSchool } from "../parent-school-context";

interface Invoice {
  id: string;
  childId: string;
  childName: string;
  amountDue: number;
  amountPaid: number;
  status: "SENT" | "PART_PAID" | "PAID" | "OVERDUE" | "DRAFT";
  dueDate: string;
  description?: string;
  items?: Array<{
    id: string;
    name: string;
    amount: number;
    quantity: number;
    amountPaid: number;
    amountOutstanding: number;
  }>;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<"all" | "outstanding" | "paid">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      const backendUrl = getBackendUrl();
      
      const res = await fetch(`${backendUrl}/api/parent/invoices`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to load invoices');
      }

      const data = await res.json();
      console.log('Invoices data:', data); // Debug
      setInvoices(data.invoices || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading invoices:", err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter invoices
  const filtered = invoices.filter((invoice) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = [invoice.childName, invoice.description, invoice.id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(searchLower);
    
    if (filter === "paid") return invoice.status === "PAID" && matchesSearch;
    if (filter === "outstanding") return ["SENT", "PART_PAID", "OVERDUE"].includes(invoice.status) && matchesSearch;
    return matchesSearch;
  });

  // Calculate totals
  const totalOutstanding = invoices
    .reduce((sum, inv) => sum + Math.max(0, (inv.amountDue || 0) - (inv.amountPaid || 0)), 0);
  const totalPaid = invoices
    .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

  const { school: parentSchool } = useParentSchool();
  const currency = useEffectiveCurrency(parentSchool);

  if (loading) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 animate-pulse"></div>
            <div className="h-9 w-56 bg-slate-200 animate-pulse"></div>
            <div className="h-4 w-72 bg-slate-100 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-border bg-surface p-5 space-y-2">
                <div className="h-4 w-24 bg-slate-100 animate-pulse"></div>
                <div className="h-8 w-24 bg-slate-200 animate-pulse"></div>
              </div>
            ))}
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border bg-surface p-4 space-y-3 animate-pulse">
              <div className="h-5 w-32 bg-slate-200 rounded"></div>
              <div className="h-4 w-48 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      </ParentPageShell>
    );
  }

  return (
    <ParentPageShell onRefresh={loadData}>
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand"><CreditCard className="h-4 w-4" /> Finance operations</div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Billing &amp; Invoices</h1>
          <p className="mt-1 text-sm text-muted">Review school fees, payment status, and invoice history</p>
        </div>
        <button type="button" onClick={() => router.push('/parent')} className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light sm:self-auto">Dashboard <ChevronRight className="h-4 w-4" /></button>
      </div>

      {error && (
        <div className="rounded-lg border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-sm text-[#a61b29] flex gap-3">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-error">Error Loading Invoices</h3>
            <p className="text-sm text-error/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Quick Totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-border bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Outstanding</p>
          <p className="mt-4 text-3xl font-semibold text-foreground">{formatMoney(totalOutstanding, currency)}</p>
          <p className="mt-1 text-xs text-muted">{invoices.filter(inv => ["SENT", "PART_PAID", "OVERDUE"].includes(inv.status)).length} pending</p>
        </div>
        <div className="border border-border bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Paid</p>
          <p className="mt-4 text-3xl font-semibold text-foreground">{formatMoney(totalPaid, currency)}</p>
          <p className="mt-1 text-xs text-muted">{invoices.filter(inv => inv.status === "PAID").length} paid</p>
        </div>
        <div className="border border-border bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Total billed</p>
          <p className="mt-4 text-3xl font-semibold text-foreground">{formatMoney(totalOutstanding + totalPaid, currency)}</p>
          <p className="mt-1 text-xs text-muted">{invoices.length} invoices</p>
        </div>
        <div className="border border-border bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Payment rate</p>
          <p className="mt-4 text-3xl font-semibold text-foreground">{invoices.length > 0 ? Math.round((totalPaid / (totalPaid + totalOutstanding)) * 100) : 0}%</p>
          <p className="mt-1 text-xs text-muted">of billed total</p>
        </div>
      </div>

      {/* Invoice List */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border bg-[#f6f8fa] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Finance records</p>
            <h2 className="mt-1 text-sm font-semibold text-foreground">Invoice history</h2>
          </div>
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..." className="min-w-[220px] rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-brand" /></div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3 bg-surface">
          {[
            { value: "all", label: "All" },
            { value: "outstanding", label: "Outstanding" },
            { value: "paid", label: "Paid" },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value as any)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === btn.value
                  ? "bg-brand text-white"
                  : "border border-border bg-surface text-brand hover:bg-brand-light"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <CreditCard className="mx-auto mb-4 h-8 w-8 text-brand" />
            <p className="text-muted font-medium">No invoices found</p>
            <p className="text-sm text-muted mt-1">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((invoice) => {
              const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== "PAID";

              const getStatusBadge = (status: string) => {
                switch (status) {
                  case "PAID":
                    return "bg-[#e6f4ea] text-[#137333] border-[#b7dfbf]";
                  case "OVERDUE":
                    return "bg-[#fff5f5] text-[#a61b29] border-[#f5c2c7]";
                  case "PART_PAID":
                    return "bg-[#fff4d6] text-[#8a5a00] border-[#f1d58a]";
                  case "SENT":
                    return "bg-brand-light text-brand border-brand/20";
                  default:
                    return "bg-background text-muted border-border";
                }
              };

              return (
                <div key={invoice.id} className="border-b border-border px-4 py-4 last:border-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Invoice {invoice.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-base font-semibold text-foreground truncate">{invoice.childName}</p>
                      <p className="text-sm text-muted mt-1 truncate">{invoice.description || "School Fees"}</p>
                      {invoice.items && invoice.items.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {invoice.items.map((item) => (
                            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                              <span className="font-medium text-foreground">{item.name}</span>
                              <span>
                                Amount {formatMoney(item.amount * item.quantity, currency)} · Paid {formatMoney(item.amountPaid, currency)} · Remaining {formatMoney(item.amountOutstanding, currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-foreground">{formatMoney(invoice.amountDue || 0, currency)}</p>
                      <p className="text-xs text-muted mt-1">Amount</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center border px-2.5 py-1 text-xs font-semibold ${getStatusBadge(invoice.status)}`}>
                      {invoice.status === "PART_PAID" ? "Partial" : invoice.status === "DRAFT" ? "Draft" : invoice.status}
                    </span>
                    <span className="text-xs text-muted">Due {new Date(invoice.dueDate).toLocaleDateString()}</span>
                    <button
                      onClick={() => router.push(`/parent/invoices/${invoice.id}`)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-hover transition"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </div>
                  {isOverdue && <p className="mt-3 text-sm font-semibold text-error">This invoice is overdue.</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Instructions */}
      {totalOutstanding > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <h3 className="text-sm font-bold text-amber-900">Payment reminder</h3>
          <p className="text-amber-800 mt-2">You have an outstanding balance of <span className="font-bold">{formatMoney(totalOutstanding, currency)}</span> due. Please make payment as soon as possible to avoid late fees.</p>
          <button className="mt-4 rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition-colors hover:bg-brand-hover">
            Make payment
          </button>
        </div>
      )}
      </div>
    </ParentPageShell>
  );
}

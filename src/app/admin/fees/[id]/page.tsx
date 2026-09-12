"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBackendUrl } from "@/lib/backend-url";
import { formatMoney, pupilName as formatPupilName, invoiceStatusLabel } from "@/lib/format";
import { playOpenTone, playCloseTone } from "@/lib/sounds";
import { Download, Printer, ChevronLeft, Check, AlertCircle, Edit2, BadgePercent, Plus, X } from "lucide-react";

const BRAND_BLUE = "#0A66C2";
const LIGHT_BLUE = "#E7F1F8";
const DARK_GRAY = "#1F2937";
const MID_GRAY = "#6B7280";
const LIGHT_GRAY = "#F3F4F6";
const BORDER_GRAY = "#E5E7EB";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [invoiceId, setInvoiceId] = useState<string>("");
  const [invoice, setInvoice] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentReference, setEditPaymentReference] = useState("");
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [pendingDeleteAdjustmentId, setPendingDeleteAdjustmentId] = useState<string | null>(null);

  const openAdjustmentModal = () => {
    setAdjustmentModalOpen(true);
    playOpenTone();
  };

  const closeAdjustmentModal = () => {
    setAdjustmentModalOpen(false);
    playCloseTone();
  };
  const [adjustmentType, setAdjustmentType] = useState("SCHOLARSHIP");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentPercentage, setAdjustmentPercentage] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await params;
      setInvoiceId(p.id);

      try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/admin/invoices/${p.id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch invoice");
        }

        const data = await response.json();
        setInvoice(data.invoice);
        setSchool(data.school);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  const handleDownloadPDF = async () => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/invoices/${invoiceId}/pdf`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNo}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download invoice");
      console.error(err);
    }
  };

  const fetchInvoice = async (id: string) => {
    try {
      setLoading(true);
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/invoices/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to fetch invoice");
      }

      const data = await response.json();
      setInvoice(data.invoice);
      setSchool(data.school);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoice");
      setInvoice(null);
      setSchool(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const p = await params;
      setInvoiceId(p.id);
      await fetchInvoice(p.id);
    })();
  }, [params]);

  const openEditPaymentModal = (payment: any) => {
    setEditingPayment(payment);
    setEditPaymentAmount((payment.amount / 100).toFixed(2));
    setEditPaymentReference(payment.reference || "");
    playOpenTone();
  };

  const closeEditPaymentModal = () => {
    setEditingPayment(null);
    setEditPaymentAmount("");
    setEditPaymentReference("");
    playCloseTone();
  };

  const handleUpdatePayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPayment || isUpdatingPayment) return;

    const amountValue = parseFloat(editPaymentAmount);
    if (!Number.isFinite(amountValue) || amountValue < 0) {
      alert("Please enter a valid payment amount. Use 0 to zero out a mistaken entry.");
      return;
    }

    setIsUpdatingPayment(true);
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/admin/fees/payments/${editingPayment.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountValue,
          reference: editPaymentReference || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update payment");
      }

      await fetchInvoice(invoiceId);
      closeEditPaymentModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update payment");
      console.error(err);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!editingPayment || isUpdatingPayment) return;

    const confirmed = window.confirm("Delete this payment history item? This will remove it from the invoice total.");
    if (!confirmed) return;

    setIsUpdatingPayment(true);
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/admin/fees/payments/${editingPayment.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to delete payment");
      }

      await fetchInvoice(invoiceId);
      closeEditPaymentModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete payment");
      console.error(err);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleCreateAdjustment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoice?.pupil?.id) return;

    const amountValue = adjustmentAmount.trim() !== "" ? Number(adjustmentAmount) : undefined;
    const percentageValue = adjustmentPercentage.trim() !== "" ? Number(adjustmentPercentage) : undefined;

    if ((amountValue === undefined) === (percentageValue === undefined)) {
      alert("Enter either a fixed amount or a percentage, not both.");
      return;
    }

    if (amountValue !== undefined && (!Number.isFinite(amountValue) || amountValue < 0)) {
      alert("Please enter a valid non-negative adjustment amount.");
      return;
    }

    if (percentageValue !== undefined && (!Number.isFinite(percentageValue) || percentageValue < 0 || percentageValue > 100)) {
      alert("Adjustment percentage must be between 0 and 100.");
      return;
    }

    setIsSavingAdjustment(true);
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/admin/fees/students/${invoice.pupil.id}/adjustments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          adjustmentType: adjustmentType,
          amount: amountValue,
          percentage: percentageValue,
          reason: adjustmentReason.trim() || "Manual fee adjustment",
          status: "APPROVED",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to save fee adjustment");
      }

      setAdjustmentAmount("");
      setAdjustmentPercentage("");
      setAdjustmentReason("");
      setAdjustmentType("SCHOLARSHIP");
      await fetchInvoice(invoiceId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save fee adjustment");
      console.error(err);
    } finally {
      setIsSavingAdjustment(false);
    }
  };

  const handleDeleteAdjustment = (adjustmentId: string) => {
    setPendingDeleteAdjustmentId(adjustmentId);
    playOpenTone();
  };

  const cancelDeleteAdjustment = () => {
    setPendingDeleteAdjustmentId(null);
    playCloseTone();
  };

  const confirmDeleteAdjustment = async () => {
    if (!pendingDeleteAdjustmentId) return;

    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/admin/fees/students/adjustments/${pendingDeleteAdjustmentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to remove fee adjustment");
      }

      setPendingDeleteAdjustmentId(null);
      await fetchInvoice(invoiceId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove fee adjustment");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/admin/fees" className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:opacity-70 transition" style={{ color: BRAND_BLUE }}>
            <ChevronLeft size={16} />
            Back to Fees
          </Link>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4" style={{ borderLeftColor: "#EF4444" }}>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} style={{ color: "#EF4444" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Invoice Not Found</h3>
                <p className="text-sm text-gray-600 mt-1">{error || "This invoice could not be loaded."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const outstanding = Math.max(0, invoice.amountDue - invoice.amountPaid);
  const isPaid = outstanding === 0;
  const isPartPaid = invoice.amountPaid > 0 && outstanding > 0;
  const pupilFullName = formatPupilName(invoice.pupil.firstName, invoice.pupil.lastName);
  const className = invoice.pupil.class
    ? `${invoice.pupil.class.name}${invoice.pupil.class.arm ? ` ${invoice.pupil.class.arm}` : ""}`
    : "Unassigned";
  const termName = invoice.feeSchedule?.term?.name || "Unknown Term";
  const academicYear = invoice.feeSchedule?.term?.academicYear?.name || "";
  const currency = school?.currency || "NGN";
  const invoiceDate = new Date(invoice.createdAt);
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
  const lineItems = invoice.items && invoice.items.length > 0 ? invoice.items : [{
    id: invoice.id,
    name: invoice.feeSchedule?.name || "School Fees",
    amount: invoice.amountDue,
    quantity: 1,
    description: `${termName} ${academicYear ? `• ${academicYear}` : ""}`,
  }];
  const invoiceAdjustments = Array.isArray(invoice.adjustments) ? invoice.adjustments : [];
  const lineItemsTyped = (lineItems as Array<{ amount?: number | null; quantity?: number | null }>) || [];
  const adjustmentList = (invoiceAdjustments as Array<{ amount?: number | null; percentage?: number | null }>) || [];
  const subtotal = lineItemsTyped.reduce((sum: number, item: { amount?: number | null; quantity?: number | null }) => {
    return sum + Number(item.amount || 0) * Number(item.quantity || 1);
  }, 0);
  const totalAdjustments = adjustmentList.reduce((sum: number, adjustment: { amount?: number | null; percentage?: number | null }) => {
    if (adjustment.amount !== null && adjustment.amount !== undefined) {
      return sum + Number(adjustment.amount || 0);
    }
    if (adjustment.percentage !== null && adjustment.percentage !== undefined) {
      return sum + Math.round((subtotal * Number(adjustment.percentage || 0)) / 100);
    }
    return sum;
  }, 0);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/admin/fees" className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition" style={{ color: BRAND_BLUE }}>
            <ChevronLeft size={16} />
            Back to Fees
          </Link>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: LIGHT_BLUE, color: BRAND_BLUE }}
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: LIGHT_BLUE, color: BRAND_BLUE }}
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="invoice-sheet rounded-xl bg-white p-7 sm:p-8 print:p-5 print:bg-white">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                {school?.logoUrl ? (
                  <img src={school.logoUrl} alt="School logo" className="h-12 w-12 rounded-full border border-gray-300 object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-gray-700">
                    {school?.name?.charAt(0) || "S"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Invoice</p>
                  <h1 className="mt-1 text-2xl font-semibold text-gray-900">{school?.name || "School Name"}</h1>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                {school?.address && <p>{school.address}</p>}
                {school?.email && <p>{school.email}</p>}
                {school?.phone && <p>{school.phone}</p>}
              </div>
            </div>

            <div className="lg:text-right">
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Invoice No.</div>
              <div className="mt-2 text-xl font-semibold text-gray-900">{invoice.invoiceNo}</div>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
                {isPaid ? <Check size={14} /> : <AlertCircle size={14} />}
                {isPaid ? "Paid" : isPartPaid ? "Part Paid" : "Outstanding"}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="grid gap-6 pb-6 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Bill To</p>
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <p className="text-lg font-semibold text-gray-900">{pupilFullName}</p>
                  <p>{className}</p>
                  <p>{termName}</p>
                  {academicYear ? <p>{academicYear}</p> : null}
                </div>
              </div>

              <div className="md:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Invoice Details</p>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-gray-900">{invoiceDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <span className="text-gray-500">Due</span>
                    <span className="font-medium text-gray-900">{dueDate ? dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "On Demand"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium text-gray-900">{invoiceStatusLabel(invoice.status)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <span className="text-gray-500">Currency</span>
                    <span className="font-medium text-gray-900">{currency}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Description</th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-5 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.description && <div className="mt-1 text-xs text-gray-500">{item.description}</div>}
                        {item.amountPaid !== undefined && (
                          <div className="mt-1 text-xs text-gray-500">
                            Paid: {formatMoney(item.amountPaid, currency)} · Remaining: {formatMoney(item.amountOutstanding || 0, currency)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-right text-base font-bold text-gray-900">{formatMoney(Number(item.amount || 0) * Number(item.quantity || 1), currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-sm">
                <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatMoney(subtotal, currency)}</span>
                </div>
                {totalAdjustments > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600">
                    <span>Scholarships & Discounts</span>
                    <span className="font-medium text-red-600">-{formatMoney(totalAdjustments, currency)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600">
                  <span>Amount Paid</span>
                  <span className="font-medium text-gray-900">{formatMoney(invoice.amountPaid, currency)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-4 text-base font-bold text-gray-900">
                  <span>{outstanding > 0 ? "Outstanding Balance" : "Total Paid"}</span>
                  <span>{formatMoney(outstanding > 0 ? outstanding : invoice.amountPaid, currency)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <BadgePercent className="h-4 w-4 text-slate-600" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Scholarships & Discounts</h3>
                </div>
                <button
                  type="button"
                  onClick={openAdjustmentModal}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {invoiceAdjustments.length > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <span>{invoiceAdjustments.length} adjustment{invoiceAdjustments.length > 1 ? "s" : ""}</span>
                    <span className="font-semibold text-red-600">-{formatMoney(totalAdjustments, currency)}</span>
                  </div>
                ) : (
                  <span>No scholarships or discounts created yet for this invoice.</span>
                )}
              </div>
            </div>

                  {invoice.payments && invoice.payments.length > 0 && (
              <div className="mt-6 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Payment History</h3>
                <div className="mt-3 space-y-3">
                  {invoice.payments.map((payment: any, idx: number) => (
                    <div key={payment.id || idx} className="flex flex-col gap-2 py-3 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{(payment.method || "Payment").replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-500">{new Date(payment.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        {payment.reference && <p className="text-xs text-gray-500">Ref: {payment.reference}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{formatMoney(payment.amount, currency)}</p>
                        <button
                          type="button"
                          onClick={() => openEditPaymentModal(payment)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Payment Instructions</h3>
              <div className="mt-3 space-y-1 text-sm text-gray-700">
                {school?.paymentAccounts?.length ? school.paymentAccounts.map((account: any) => (
                  <div key={account.id} className="mb-4 border-b border-gray-100 pb-3 last:border-0">
                    <p className="font-semibold text-gray-900">{account.label}</p>
                    <p><span className="font-medium text-gray-900">Bank:</span> {account.bankName}</p>
                    <p><span className="font-medium text-gray-900">Account Name:</span> {account.accountName}</p>
                    <p><span className="font-medium text-gray-900">Account Number:</span> {account.accountNumber}</p>
                  </div>
                )) : school?.manualPaymentAccountName || school?.manualPaymentAccountNumber || school?.manualPaymentBankName ? <>
                  {school.manualPaymentAccountName && <p><span className="font-medium text-gray-900">Account Name:</span> {school.manualPaymentAccountName}</p>}
                  {school.manualPaymentAccountNumber && <p><span className="font-medium text-gray-900">Account Number:</span> {school.manualPaymentAccountNumber}</p>}
                  {school.manualPaymentBankName && <p><span className="font-medium text-gray-900">Bank:</span> {school.manualPaymentBankName}</p>}
                </> : (
                  <p>Payments should be made through the school’s approved payment channel. Kindly keep a copy of the receipt for reference.</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 text-center text-xs text-gray-500">
              <p>This invoice was generated by SchoolBase and should be retained for your records.</p>
            </div>
          </div>
        </div>
      </div>

      {pendingDeleteAdjustmentId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <style>{`
            @keyframes fee_adjustment_confirm_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
          `}</style>

          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
            style={{ animation: "fee_adjustment_confirm_enter 320ms cubic-bezier(.2,.9,.2,1)" }}
          >
            <div className="border-b border-border px-6 py-5" style={{ background: "linear-gradient(90deg, rgba(10,102,194,0.12), rgba(10,102,194,0.04))" }}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/70 bg-brand/10 shadow-sm">
                  <AlertCircle className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Remove this scholarship or discount record?</h2>
                  <p className="mt-1 text-sm text-slate-600">This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm leading-6 text-slate-700">
                  You are about to remove this fee adjustment from the invoice. The total balance will be recalculated immediately.
                </p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={cancelDeleteAdjustment}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAdjustment}
                className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {adjustmentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
            style={{ animation: "payment_edit_enter 320ms cubic-bezier(.2,.9,.2,1)" }}
          >
            <div className="border-b border-border px-6 py-5" style={{ background: "linear-gradient(90deg, rgba(10,102,194,0.12), rgba(10,102,194,0.04))" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/70 bg-brand/10 shadow-sm">
                    <BadgePercent className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Scholarships & Discounts</h2>
                    <p className="mt-1 text-sm text-slate-600">Manage fee reductions for this invoice.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustmentModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-slate-600 transition hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5">
              <form onSubmit={handleCreateAdjustment} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Type</label>
                    <select
                      value={adjustmentType}
                      onChange={(event) => setAdjustmentType(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      <option value="SCHOLARSHIP">Scholarship</option>
                      <option value="DISCOUNT">Discount</option>
                      <option value="WAIVER">Waiver</option>
                      <option value="BURSARY">Bursary</option>
                      <option value="EXEMPTION">Exemption</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Fixed amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={adjustmentAmount}
                      onChange={(event) => {
                        setAdjustmentAmount(event.target.value);
                        if (event.target.value !== "") setAdjustmentPercentage("");
                      }}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={adjustmentPercentage}
                      onChange={(event) => {
                        setAdjustmentPercentage(event.target.value);
                        if (event.target.value !== "") setAdjustmentAmount("");
                      }}
                      placeholder="0%"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Reason</label>
                    <input
                      type="text"
                      value={adjustmentReason}
                      onChange={(event) => setAdjustmentReason(event.target.value)}
                      placeholder="Academic excellence, family support, sibling discount..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={closeAdjustmentModal}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAdjustment}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {isSavingAdjustment ? "Saving..." : "Add"}
                  </button>
                </div>
              </form>

              <div className="mt-5 border-t border-slate-200 pt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Current entries</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{invoiceAdjustments.length}</span>
                </div>

                {invoiceAdjustments.length > 0 ? (
                  <div className="space-y-2">
                    {invoiceAdjustments.map((adjustment: any) => {
                      const amountLabel = adjustment.amount !== null && adjustment.amount !== undefined
                        ? formatMoney(Number(adjustment.amount || 0), currency)
                        : adjustment.percentage !== null && adjustment.percentage !== undefined
                          ? `${Number(adjustment.percentage || 0).toFixed(2)}%`
                          : "N/A";

                      return (
                        <div key={adjustment.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{(adjustment.adjustmentType || "Adjustment").replace(/_/g, " ")}</p>
                            {adjustment.reason && <p className="text-[11px] text-slate-500">{adjustment.reason}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-red-600">-{amountLabel}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdjustment(adjustment.id)}
                              className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 transition hover:bg-red-100"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">No scholarships or discounts created yet for this invoice.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingPayment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <style>{`
            @keyframes payment_edit_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
          `}</style>

          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
            style={{ animation: `payment_edit_enter 320ms cubic-bezier(.2,.9,.2,1)` }}
          >
            <div className="border-b border-slate-100 px-6 py-5" style={{ background: "linear-gradient(90deg, rgba(10,102,194,0.12), rgba(10,102,194,0.04))" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Edit payment</h2>
                  <p className="mt-1 text-sm text-muted">Adjust the recorded payment amount or reference.</p>
                </div>
                <button
                  type="button"
                  onClick={closeEditPaymentModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-background transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdatePayment} className="space-y-5 px-6 py-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Payment amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPaymentAmount}
                  onChange={(event) => setEditPaymentAmount(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
                <p className="mt-2 text-xs text-slate-500">Use 0 to zero out a mistaken payment entry, or delete it completely below.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Reference</label>
                <input
                  type="text"
                  value={editPaymentReference}
                  onChange={(event) => setEditPaymentReference(event.target.value)}
                  placeholder="Update receipt or transfer reference"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeEditPaymentModal}
                  disabled={isUpdatingPayment}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeletePayment}
                  disabled={isUpdatingPayment}
                  className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  {isUpdatingPayment ? "Working..." : "Delete"}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPayment}
                  className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
                >
                  {isUpdatingPayment ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .invoice-sheet {
          width: min(100%, 1000px);
          min-height: 100%;
          margin: 0 auto;
          box-sizing: border-box;
          transition: width 200ms ease;
        }

        @page {
          size: A4;
          margin: 12mm;
        }

        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }

          .invoice-sheet {
            width: 210mm !important;
            min-height: 297mm !important;
            max-width: none !important;
            margin: 0 auto;
            padding: 12mm !important;
            border: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\\:p-6 {
            padding: 1.5rem !important;
          }
          
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          
          .print\\:mt-6 {
            margin-top: 1.5rem !important;
          }
          
          .print\\:pt-4 {
            padding-top: 1rem !important;
          }
          
          .print\\:pt-6 {
            padding-top: 1.5rem !important;
          }
          
          .print\\:gap-4 {
            gap: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useMemo, useState, useEffect, useTransition, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { setSchoolPlanAction, approveSchoolSubscriptionAction, rejectSchoolSubscriptionAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getBackendUrl } from "@/lib/backend-url";
import { resolveSchoolAssetUrl } from "@/lib/asset-urls";
import { playCloseTone, playOpenTone } from "@/lib/sounds";
import { Pagination } from "@/components/ui/pagination";
import type { School } from "@prisma/client";

const PLAN_CONFIG = {
  FREE: { label: "Free", color: "bg-gray-100 text-gray-800" },
  STARTER: { label: "Starter", color: "bg-blue-100 text-blue-800" },
  GROWTH: { label: "Growth", color: "bg-purple-100 text-purple-800" },
  ENTERPRISE: { label: "Enterprise", color: "bg-yellow-100 text-yellow-800" },
};

const DEFAULT_PLAN_OPTIONS = [
  { value: "STARTER", label: "Starter" },
  { value: "GROWTH", label: "Growth" },
];

const STATUS_CONFIG = {
  TRIAL: { label: "Trial", color: "bg-info/10 text-info" },
  ACTIVE: { label: "Active", color: "bg-success/10 text-success" },
  SUSPENDED: { label: "Suspended", color: "bg-warning/10 text-warning" },
  CANCELLED: { label: "Cancelled", color: "bg-error/10 text-error" },
};

const ITEMS_PER_PAGE = 15;
const PAYMENTS_PER_PAGE = 10;

function toInputDate(value?: string | Date | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatExpiryDate(school: School) {
  const value = school.subscriptionExpiresAt ?? school.trialEndsAt;
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface SubscriptionPaymentRecord {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  createdAt: string;
  schoolId: string | null;
  schoolName: string;
  schoolSlug: string | null;
  schoolEmail: string | null;
  schoolCountry: string | null;
  plan: string | null;
  status: string | null;
  paymentStatus: string | null;
}

export default function SubscriptionsPageClient({
  schools: initialSchools,
  payments: initialPayments,
}: {
  schools: School[];
  payments: SubscriptionPaymentRecord[];
}) {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [payments, setPayments] = useState<SubscriptionPaymentRecord[]>(initialPayments);
  const [activeTab, setActiveTab] = useState<"overview" | "payments">("overview");
  const [paymentPage, setPaymentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({});
  const [editingExpiryId, setEditingExpiryId] = useState<string | null>(null);
  const [editingExpiryValue, setEditingExpiryValue] = useState<string>("");
  const [savingExpiry, setSavingExpiry] = useState(false);
  const [planOptions, setPlanOptions] = useState(DEFAULT_PLAN_OPTIONS);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    fetch("/api/pricing", { credentials: "include", cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!mounted || !data?.plans) return;
        setPlanOptions([
          { value: "STARTER", label: `${data.plans.starter?.label || "Starter"} - ${data.plans.starter?.priceLabel || "Configured price"}` },
          { value: "GROWTH", label: `${data.plans.standard?.label || "Growth"} - ${data.plans.standard?.priceLabel || "Configured price"}` },
        ]);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const handleSetExpiry = async (schoolId: string, expiresAt: string) => {
    try {
      setSavingExpiry(true);
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/schoolbase-admin/api/schools`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ schoolId, action: "setExpiry", expiresAt }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to save expiry date");
      }
      setSchools((current) =>
        current.map((school) =>
          school.id === schoolId
            ? {
                ...school,
                subscriptionExpiresAt: new Date(expiresAt),
                status: school.status === "ACTIVE" ? school.status : "ACTIVE",
              }
            : school,
        ),
      );
    } catch (error) {
      console.error("Failed to save expiry date:", error);
    } finally {
      setSavingExpiry(false);
    }
  };

  const openExpiryModal = (school: School) => {
    setEditingExpiryId(school.id);
    setEditingExpiryValue(
      toInputDate(school.subscriptionExpiresAt ?? school.trialEndsAt),
    );
    playOpenTone();
  };

  const closeExpiryModal = () => {
    setEditingExpiryId(null);
    setEditingExpiryValue("");
    playCloseTone();
  };

  const handleSetPlan = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await setSchoolPlanAction(formData);
        if (result?.school) {
          setSchools((current) =>
            current.map((school) =>
              school.id === result.school.id ? { ...school, ...result.school } : school,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to set plan:", error);
      }
    });
  };

  const handleApproveSubscription = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await approveSchoolSubscriptionAction(formData);
        if (result?.school) {
          setSchools((current) =>
            current.map((school) =>
              school.id === result.school.id ? { ...school, ...result.school } : school,
            ),
          );
          setSelectedPlans((current) => ({
            ...current,
            [result.school.id]: result.school.plan || current[result.school.id] || "STARTER",
          }));
        }
      } catch (error) {
        console.error("Failed to approve subscription:", error);
      }
    });
  };

  const handleRejectSubscription = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await rejectSchoolSubscriptionAction(formData);
        if (result?.school) {
          setSchools((current) =>
            current.map((school) =>
              school.id === result.school.id ? { ...school, ...result.school } : school,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to reject subscription:", error);
      }
    });
  };

  useEffect(() => {
    setPayments(initialPayments);
    setPaymentPage(1);
  }, [initialPayments]);

  useEffect(() => {
    setSelectedPlans((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const school of schools) {
        if (school.status === "PENDING" && !next[school.id]) {
          next[school.id] = "STARTER";
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [schools]);

  // Get pending schools
  const pendingSchools = useMemo(() => {
    return schools.filter((s) => s.status === "PENDING");
  }, [schools]);

  // Only show tabs for All, Free, Growth
  const PLAN_TAB_ORDER = ["ALL", "FREE", "GROWTH"];
  const STATUS_TAB_ORDER = ["ALL", "TRIAL", "ACTIVE"];

  // Filter schools
  const filteredSchools = useMemo(() => {
    let filtered = schools;

    // Filter by plan
    if (planFilter !== "ALL") {
      filtered = filtered.filter((s) => s.plan === planFilter);
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }


    // Filter by search (name, slug, country)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(query) ||
        s.slug.toLowerCase().includes(query) ||
        s.country.toLowerCase().includes(query) ||
        (s.email && s.email.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [schools, searchQuery, planFilter, statusFilter]);

  const getPlanStats = (plan: string) => {
    if (plan === "ALL") return schools.length;
    return schools.filter((s) => s.plan === plan).length;
  };

  const getStatusStats = (status: string) => {
    if (status === "ALL") return schools.length;
    return schools.filter((s) => s.status === status).length;
  };

  const totalPages = Math.ceil(filteredSchools.length / ITEMS_PER_PAGE);
  const paginatedSchools = filteredSchools.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const paymentTotalPages = Math.max(1, Math.ceil(payments.length / PAYMENTS_PER_PAGE));
  const paginatedPayments = payments.slice(
    (paymentPage - 1) * PAYMENTS_PER_PAGE,
    paymentPage * PAYMENTS_PER_PAGE,
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  function ActionDropdown({ onCancel }: { onCancel: () => void }) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
      if (!open || !btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      const top = rect.bottom + 8 + window.scrollY;
      const left = Math.max(8 + window.scrollX, rect.right - 160 + window.scrollX);
      setPos({ top, left });
    }, [open]);

    useEffect(() => {
      function onDocClick(e: MouseEvent) {
        if (!open) return;
        const target = e.target as Node;
        if (btnRef.current && btnRef.current.contains(target)) return;
        if (menuRef.current && menuRef.current.contains(target)) return;
        setOpen(false);
      }
      document.addEventListener("click", onDocClick);
      return () => document.removeEventListener("click", onDocClick);
    }, [open]);

    return (
      <div className="relative inline-block text-left">
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium border border-border bg-background"
        >
          •••
        </button>
        {open && pos
          ? createPortal(
              <div
                ref={menuRef}
                style={{ position: "absolute", top: `${pos.top}px`, left: `${pos.left}px`, width: "176px" }}
                className="z-50 origin-top-right rounded-md border border-border bg-background shadow-lg"
              >
                <div className="py-1">
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface"
                    onClick={() => {
                      setOpen(false);
                      onCancel();
                    }}
                  >
                    Cancel subscription
                  </button>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="border-b border-border pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${activeTab === "overview" ? "bg-brand text-white" : "text-muted hover:bg-background"}`}
            >
              School Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("payments")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${activeTab === "payments" ? "bg-brand text-white" : "text-muted hover:bg-background"}`}
            >
              Payment History
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="grid w-full gap-2 sm:grid-cols-[1.2fr_auto_auto_auto] lg:max-w-[760px] lg:items-center">
              <input
                type="text"
                placeholder="Search by school name, slug, email, or country..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
              >
                <option value="ALL">All plans</option>
                <option value="FREE">Free</option>
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="TRIAL">Trial</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <div className="min-w-0 text-xs text-muted">
                Showing {paginatedSchools.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredSchools.length)} of {filteredSchools.length} school{filteredSchools.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === "payments" ? (
        <div className="border border-border bg-surface p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Subscription Payments</h2>
              <p className="text-sm text-muted">Recent successful subscription payments with school details and payment status.</p>
            </div>
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              {payments.length} payment{payments.length === 1 ? "" : "s"}
            </span>
          </div>

          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-background text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">School</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Country</th>
                    <th className="px-3 py-2 font-medium">Plan</th>
                    <th className="px-3 py-2 font-medium">Payment Status</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Method</th>
                    <th className="px-3 py-2 font-medium">Reference</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map((payment) => (
                    <tr key={payment.id} className="border-t border-border hover:bg-background/50 transition-colors">
                      <td className="px-3 py-2">
                        <div className="font-medium text-foreground">{payment.schoolName}</div>
                        {payment.schoolSlug ? <div className="text-xs text-muted">{payment.schoolSlug}</div> : null}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">{payment.schoolEmail || "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted">{payment.schoolCountry || "—"}</td>
                      <td className="px-3 py-2">{payment.plan ? <Badge variant="default">{payment.plan}</Badge> : "—"}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                          {payment.paymentStatus || "COMPLETED"}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium text-foreground">
                        {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format((payment.amount || 0) / 100)}
                      </td>
                      <td className="px-3 py-2 text-foreground">{payment.method}</td>
                      <td className="px-3 py-2 text-xs text-muted">{payment.reference || "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted">
                        {new Date(payment.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted">
              No subscription payments have been recorded yet.
            </div>
          )}
          {payments.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs text-muted">
                Showing {(paymentPage - 1) * PAYMENTS_PER_PAGE + 1}–
                {Math.min(paymentPage * PAYMENTS_PER_PAGE, payments.length)} of {payments.length} payments
              </p>
              <Pagination
                currentPage={paymentPage}
                totalPages={paymentTotalPages}
                onPageChange={setPaymentPage}
                className="mt-3"
              />
            </div>
          )}
        </div>
      ) : (
        <>
          {pendingSchools.length > 0 && (
        <div className="border border-border bg-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-warning animate-pulse"></div>
            <h2 className="text-lg font-semibold text-foreground">Pending Approvals</h2>
            <Badge variant="warning">{pendingSchools.length}</Badge>
          </div>

          <p className="text-sm text-muted mb-4">
            Schools that have signed up and are waiting for subscription approval after payment.
          </p>

          <div className="space-y-3">
            {pendingSchools.map((school) => (
              <div
                key={school.id}
                className="flex flex-col gap-3 border border-border bg-background p-4 transition hover:bg-surface sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{school.name}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                    <span>{school.slug}</span>
                    <span>•</span>
                    <span>{school.country}</span>
                    <span>•</span>
                    <span>{school.email}</span>
                    <span>•</span>
                    <span>Signed up {new Date(school.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <select
                    value={selectedPlans[school.id] || "STARTER"}
                    onChange={(e) =>
                      setSelectedPlans({
                        ...selectedPlans,
                        [school.id]: e.target.value,
                      })
                    }
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {planOptions.map((plan) => (
                      <option key={plan.value} value={plan.value}>
                        {plan.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        handleApproveSubscription(formData);
                      }}
                    >
                      <input type="hidden" name="schoolId" value={school.id} />
                      <input type="hidden" name="plan" value={selectedPlans[school.id] || "STARTER"} />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-lg bg-success px-4 py-2 text-xs font-semibold text-white hover:bg-success/90 transition-colors whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ✓ Approve
                      </button>
                    </form>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        handleRejectSubscription(formData);
                      }}
                    >
                      <input type="hidden" name="schoolId" value={school.id} />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-lg bg-error px-4 py-2 text-xs font-semibold text-white hover:bg-error/90 transition-colors whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ✕ Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schools Table */}
      {paginatedSchools.length > 0 ? (
        <div className="space-y-4">
          <div className="hidden overflow-x-auto border border-border bg-surface sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">School</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Change Plan</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSchools.map((school) => (
                  <tr key={school.id} className="border-t border-border hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-brand/10 text-sm font-semibold text-brand shadow-sm">
                          {school.logoUrl ? (
                            <img
                              src={resolveSchoolAssetUrl(school.logoUrl) || school.logoUrl}
                              alt={`${school.name} logo`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{school.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div>{school.name}</div>
                          <div className="text-xs text-muted mt-0.5">{school.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted text-sm">{school.country}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">
                        {PLAN_CONFIG[school.plan as keyof typeof PLAN_CONFIG]?.label || school.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          school.status === "ACTIVE"
                            ? "success"
                            : school.status === "SUSPENDED"
                              ? "warning"
                              : school.status === "CANCELLED"
                                ? "error"
                                : "default"
                        }
                      >
                        {school.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      <div className="flex items-center gap-2">
                        <span>{formatExpiryDate(school)}</span>
                        <button
                          type="button"
                          onClick={() => openExpiryModal(school)}
                          className="rounded bg-brand px-2 py-1 text-xs font-semibold text-white hover:bg-brand/90 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          const formData = new FormData(event.currentTarget);
                          handleSetPlan(formData);
                        }}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="schoolId" value={school.id} />
                        <select
                          name="plan"
                          defaultValue={school.plan}
                          className="rounded border border-border px-2 py-1 text-xs font-medium"
                        >
                          <option value="FREE">Free</option>
                          <option value="STARTER">Starter</option>
                          <option value="GROWTH">Growth</option>
                          <option value="ENTERPRISE">Enterprise</option>
                        </select>
                        <button
                          type="submit"
                          disabled={isPending}
                          className="rounded bg-brand px-2 py-1 text-xs font-medium text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Set
                        </button>
                        <ActionDropdown
                          onCancel={() =>
                            startTransition(async () => {
                              try {
                                const formData = new FormData();
                                formData.set("schoolId", school.id);
                                const result = await rejectSchoolSubscriptionAction(formData);
                                if (result?.school) {
                                  setSchools((current) =>
                                    current.map((s) => (s.id === result.school.id ? { ...s, ...result.school } : s)),
                                  );
                                }
                              } catch (error) {
                                console.error("Failed to cancel subscription:", error);
                              }
                            })
                          }
                        />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="sm:hidden space-y-2">
            {paginatedSchools.map((school) => (
              <div
                key={school.id}
                className="rounded-lg border border-border bg-surface px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-3xl bg-brand/10 text-2xl font-semibold text-brand shadow-sm">
                      {school.logoUrl ? (
                        <img
                          src={resolveSchoolAssetUrl(school.logoUrl) || school.logoUrl}
                          alt={`${school.name} logo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{school.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground">{school.name}</p>
                      <p className="text-xs text-muted mt-0.5">{school.slug}</p>
                    </div>
                  </div>
                  <div>
                    <Badge variant="default" className="text-xs">
                      {PLAN_CONFIG[school.plan as keyof typeof PLAN_CONFIG]?.label || school.plan}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted mb-3">
                  <span>{school.country}</span>
                  <span>•</span>
                  <span>{school.status}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted mb-3">
                  <span>Expires: {formatExpiryDate(school)}</span>
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    handleSetPlan(formData);
                  }}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="schoolId" value={school.id} />
                  <select
                    name="plan"
                    defaultValue={school.plan}
                    className="flex-1 rounded border border-border px-2 py-1 text-xs font-medium"
                  >
                    <option value="FREE">Free</option>
                    <option value="STARTER">Starter</option>
                    <option value="GROWTH">Growth</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Set
                  </button>
                  <ActionDropdown
                    onCancel={() =>
                      startTransition(async () => {
                        try {
                          const formData = new FormData();
                          formData.set("schoolId", school.id);
                          const result = await rejectSchoolSubscriptionAction(formData);
                          if (result?.school) {
                            setSchools((current) =>
                              current.map((s) => (s.id === result.school.id ? { ...s, ...result.school } : s)),
                            );
                          }
                        } catch (error) {
                          console.error("Failed to cancel subscription:", error);
                        }
                      })
                    }
                  />
                </form>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted sm:text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded px-2 py-1 border border-border text-xs font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                  .map((page, index, arr) => (
                    <div key={page}>
                      {index > 0 && arr[index - 1] !== page - 1 && (
                        <span className="px-1 py-1 text-xs text-muted">…</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          page === currentPage
                            ? "bg-primary text-white"
                            : "border border-border text-foreground hover:bg-background"
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded px-2 py-1 border border-border text-xs font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface px-4 py-8 text-center sm:px-6 sm:py-12">
          <p className="text-xs text-muted sm:text-sm">
            {searchQuery ? `No schools found matching "${searchQuery}"` : "No schools found"}
          </p>
        </div>
      )}
        </>
      )}

      {editingExpiryId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <style>{`
            @keyframes subscriptions_expiry_modal_enter { from { transform: translateY(24px) scale(.98); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
          `}</style>
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
            style={{ animation: `subscriptions_expiry_modal_enter 260ms cubic-bezier(.2,.9,.2,1)` }}
          >
            <div className="border-b border-border px-6 py-5 bg-background/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Edit expiry date</h2>
                  <p className="mt-1 text-sm text-muted">Update the subscription expiry date for this school.</p>
                </div>
                <button
                  type="button"
                  onClick={closeExpiryModal}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-background transition-colors"
                  aria-label="Close expiry modal"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-6 py-6">
              <label className="block text-sm font-medium text-foreground mb-2">Expiry date</label>
              <input
                type="date"
                value={editingExpiryValue}
                onChange={(e) => setEditingExpiryValue(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-border bg-background px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeExpiryModal}
                disabled={savingExpiry}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={async () => {
                  if (!editingExpiryId || !editingExpiryValue) return;
                  await handleSetExpiry(editingExpiryId, editingExpiryValue);
                  closeExpiryModal();
                }}
                disabled={savingExpiry || !editingExpiryValue}
              >
                {savingExpiry ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

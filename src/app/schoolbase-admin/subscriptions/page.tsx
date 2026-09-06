"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, LifeBuoy, School2 } from "lucide-react";
import AdminSkeleton from "@/components/ui/skeleton";
import SubscriptionsClient from "./subscriptions-client";

export default function SubscriptionsPage() {
  const [schools, setSchools] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [schoolsRes, paymentsRes] = await Promise.all([
        fetch(`/schoolbase-admin/api/schools?limit=500`, {
          credentials: "include",
        }),
        fetch(`/schoolbase-admin/api/subscription-payments?limit=100`, {
          credentials: "include",
        }),
      ]);

      const schoolsData = await schoolsRes.json();
      const paymentsData = await paymentsRes.json();

      setSchools(schoolsData.schools || []);
      setPayments(paymentsData.payments || []);
    } catch (err) {
      console.error("Error loading subscriptions data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleFocus = () => {
      loadData();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    });

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [loadData]);

  if (loading) {
    return (
      <SubscriptionPageFrame>
        <AdminSkeleton />
      </SubscriptionPageFrame>
    );
  }

  return (
    <SubscriptionPageFrame>
      <SubscriptionsClient schools={schools} payments={payments} />
    </SubscriptionPageFrame>
  );
}

function SubscriptionPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <CreditCard size={17} /> Billing operations
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="mt-1 text-muted">Manage school plans, approvals, billing history, and expiry dates</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/schoolbase-admin/schools?status=TRIAL" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light">
            <School2 className="h-4 w-4" /> Trial schools
          </Link>
          <Link href="/schoolbase-admin/support" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover">
            <LifeBuoy className="h-4 w-4" /> Billing support
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

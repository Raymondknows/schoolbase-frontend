"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LifeBuoy, School2 } from "lucide-react";
import AdminPageShell from "@/components/admin-page-shell";
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
      <AdminPageShell
        title="Subscriptions"
        subtitle="Manage school subscriptions and billing"
        actions={
          <>
            <Link href="/schoolbase-admin/schools?status=TRIAL" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface">
              <School2 className="h-4 w-4" />
              Trial schools
            </Link>
            <Link href="/schoolbase-admin/support" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90">
              <LifeBuoy className="h-4 w-4" />
              Billing support
            </Link>
          </>
        }
      >
        <div className="px-3 py-6 sm:px-5">
          <AdminSkeleton />
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title="Subscriptions"
      subtitle="Manage school subscriptions and billing"
      actions={
        <>
          <Link href="/schoolbase-admin/schools?status=TRIAL" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface">
            <School2 className="h-4 w-4" />
            Trial schools
          </Link>
          <Link href="/schoolbase-admin/support" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90">
            <LifeBuoy className="h-4 w-4" />
            Billing support
          </Link>
        </>
      }
    >
      <div className="px-3 py-6 sm:px-5 space-y-6">
        <SubscriptionsClient schools={schools} payments={payments} />
      </div>
    </AdminPageShell>
  );
}

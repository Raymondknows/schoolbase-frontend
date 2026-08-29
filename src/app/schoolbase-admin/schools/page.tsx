"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { BellRing, GraduationCap } from "lucide-react";
import AdminPageShell from "@/components/admin-page-shell";
import SchoolsViewSwitcher from "./schools-view-switcher";

export default function SchoolsPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  return (
    <AdminPageShell
      title="Schools Management"
      subtitle="View and manage all schools on the platform"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/schoolbase-admin/setup-reminders" className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90">
            <BellRing className="h-4 w-4" />
            Setup reminders
          </Link>
          <Link href="/schoolbase-admin/schools?status=TRIAL" className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface">
            <GraduationCap className="h-4 w-4" />
            Trial schools
          </Link>
          <div className="inline-flex items-center rounded-full border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${
                viewMode === "list" ? "bg-white text-brand shadow-sm" : "bg-transparent text-foreground"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${
                viewMode === "grid" ? "bg-white text-brand shadow-sm" : "bg-transparent text-foreground"
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      }
    >
      <div className="px-0.5 py-1.5 sm:px-1 sm:py-2">
        <Suspense fallback={<div className="text-center py-8 text-muted">Loading schools...</div>}>
          <SchoolsViewSwitcher initialSchools={[]} viewMode={viewMode} setViewMode={setViewMode} />
        </Suspense>
      </div>
    </AdminPageShell>
  );
}

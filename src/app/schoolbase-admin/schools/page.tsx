"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { BellRing, Building2, GraduationCap, List, LayoutGrid } from "lucide-react";
import SchoolsViewSwitcher from "./schools-view-switcher";

export default function SchoolsPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <Building2 size={17} /> School operations
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Schools</h1>
          <p className="mt-1 text-muted">View, monitor, and manage every school on the platform</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/schoolbase-admin/setup-reminders" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light">
            <BellRing className="h-4 w-4" /> Setup reminders
          </Link>
          <Link href="/schoolbase-admin/schools?status=TRIAL" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover">
            <GraduationCap className="h-4 w-4" /> Trial schools
          </Link>
          <div className="flex rounded-lg border border-border bg-surface p-1 text-sm">
            <button type="button" onClick={() => setViewMode("list")} aria-label="List view" className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold ${viewMode === "list" ? "bg-brand text-white" : "text-muted hover:bg-background"}`}>
              <List className="h-4 w-4" /> List
            </button>
            <button type="button" onClick={() => setViewMode("grid")} aria-label="Grid view" className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold ${viewMode === "grid" ? "bg-brand text-white" : "text-muted hover:bg-background"}`}>
              <LayoutGrid className="h-4 w-4" /> Grid
            </button>
          </div>
        </div>
      </div>
      <Suspense fallback={<div className="border border-border bg-surface py-16 text-center text-muted">Loading schools...</div>}>
        <SchoolsViewSwitcher initialSchools={[]} viewMode={viewMode} setViewMode={setViewMode} />
      </Suspense>
    </div>
  );
}

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { BellRing, GraduationCap, List, LayoutGrid } from "lucide-react";
import SchoolsViewSwitcher from "./schools-view-switcher";

export default function SchoolsPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <style>{`@keyframes support-page-pulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgb(10 102 194 / .4) } 50% { opacity: .55; box-shadow: 0 0 0 7px rgb(10 102 194 / 0) } } @keyframes support-page-scan { from { transform: translateX(-100%) } to { transform: translateX(100%) } } .support-page-hero { position: relative; overflow: hidden; } .support-page-scan { position: absolute; inset: 0 auto 0 0; width: 33%; background: linear-gradient(to right, transparent, rgb(10 102 194 / .10), transparent); animation: support-page-scan 3.2s linear infinite; pointer-events: none; } .support-page-pulse { animation: support-page-pulse 0.9s ease-in-out infinite; }`}</style>

      <header className="support-page-hero relative overflow-hidden border border-border bg-surface px-6 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
        <div className="support-page-scan" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand">
              <span className="support-page-pulse h-2.5 w-2.5 rounded-full bg-brand" />
              School operations
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Schools</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">View, monitor, and manage every school on the platform.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/schoolbase-admin/setup-reminders" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#0A66C2]/20 bg-white px-4 text-sm font-semibold text-[#0A66C2] transition hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/5">
              <BellRing className="h-4 w-4" /> Setup reminders
            </Link>
            <Link href="/schoolbase-admin/schools?status=TRIAL" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0A66C2] px-4 text-sm font-semibold text-white transition hover:bg-[#0952a4]">
              <GraduationCap className="h-4 w-4" /> Trial schools
            </Link>
            <div className="flex rounded-xl border border-border bg-surface p-1 text-sm">
              <button type="button" onClick={() => setViewMode("list")} aria-label="List view" className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3.5 font-semibold transition ${viewMode === "list" ? "bg-[#0A66C2] text-white" : "text-muted hover:bg-background"}`}>
                <List className="h-4 w-4" /> List
              </button>
              <button type="button" onClick={() => setViewMode("grid")} aria-label="Grid view" className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3.5 font-semibold transition ${viewMode === "grid" ? "bg-[#0A66C2] text-white" : "text-muted hover:bg-background"}`}>
                <LayoutGrid className="h-4 w-4" /> Grid
              </button>
            </div>
          </div>
        </div>
      </header>
      <Suspense fallback={<div className="border border-border bg-surface py-16 text-center text-muted">Loading schools...</div>}>
        <SchoolsViewSwitcher initialSchools={[]} viewMode={viewMode} />
      </Suspense>
    </div>
  );
}

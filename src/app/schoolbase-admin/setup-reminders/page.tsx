"use client";

import Link from "next/link";
import { BellRing, ClipboardList, GraduationCap } from "lucide-react";
import SetupRemindersClient from "./setup-reminders-client";

export default function SetupRemindersPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <ClipboardList size={17} /> Onboarding operations
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Setup Reminders</h1>
          <p className="mt-1 text-muted">Schools that haven&apos;t completed their setup process</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/schoolbase-admin/email-center" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light">
            <BellRing className="h-4 w-4" /> Send reminder
          </Link>
          <Link href="/schoolbase-admin/schools?status=TRIAL" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover">
            <GraduationCap className="h-4 w-4" /> View trial schools
          </Link>
        </div>
      </div>
      <SetupRemindersClient initialSchools={[]} initialEmailLogs={[]} />
    </div>
  );
}

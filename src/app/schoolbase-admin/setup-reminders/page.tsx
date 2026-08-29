"use client";

import Link from "next/link";
import { BellRing, GraduationCap } from "lucide-react";
import AdminPageShell from "@/components/admin-page-shell";
import SetupRemindersClient from "./setup-reminders-client";

export default function SetupRemindersPage() {
  return (
    <AdminPageShell
      title="Setup Reminders"
      subtitle="Schools that haven't completed their setup process"
      actions={
        <>
          <Link href="/schoolbase-admin/email-center" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface">
            <BellRing className="h-4 w-4" />
            Send reminder
          </Link>
          <Link href="/schoolbase-admin/schools?status=TRIAL" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90">
            <GraduationCap className="h-4 w-4" />
            View trial schools
          </Link>
        </>
      }
    >
      <div className="space-y-4 sm:space-y-6">
        <SetupRemindersClient initialSchools={[]} initialEmailLogs={[]} />
      </div>
    </AdminPageShell>
  );
}

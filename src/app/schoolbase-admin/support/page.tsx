"use client";

import Link from "next/link";
import { HelpCircle, MailPlus, PlusCircle } from "lucide-react";
import SupportRequestsClient from "./support-requests-client";

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand"><HelpCircle size={17} /> Support operations</div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Support Requests</h1>
          <p className="mt-1 text-muted">Track and resolve school support tickets from one place</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/schoolbase-admin/email-center" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"><MailPlus className="h-4 w-4" /> Email center</Link>
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"><PlusCircle className="h-4 w-4" /> New ticket</button>
        </div>
      </div>
      <SupportRequestsClient initialRequests={[]} />
    </div>
  );
}

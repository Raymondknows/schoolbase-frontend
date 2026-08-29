"use client";

import Link from "next/link";
import { MailPlus, PlusCircle } from "lucide-react";
import AdminPageShell from "@/components/admin-page-shell";
import SupportRequestsClient from "./support-requests-client";

export default function SupportPage() {
  return (
    <AdminPageShell
      title="Support Requests"
      subtitle="Track and resolve school support tickets from one place"
      actions={
        <>
          <Link href="/schoolbase-admin/email-center" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface">
            <MailPlus className="h-4 w-4" />
            Email center
          </Link>
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90">
            <PlusCircle className="h-4 w-4" />
            New ticket
          </button>
        </>
      }
    >
      <div className="px-3 py-3 sm:px-2">
        <SupportRequestsClient initialRequests={[]} />
      </div>
    </AdminPageShell>
  );
}

"use client";

import Link from "next/link";
import { LifeBuoy, Save } from "lucide-react";
import AdminPageShell from "@/components/admin-page-shell";
import SettingsClient from "./settings-client";

export default function SettingsPage() {
  return (
    <AdminPageShell
      title="Settings"
      subtitle="Platform admin settings and configuration"
      actions={
        <>
          <Link href="/schoolbase-admin/support" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface">
            <LifeBuoy className="h-4 w-4" />
            Support help
          </Link>
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90">
            <Save className="h-4 w-4" />
            Save settings
          </button>
        </>
      }
    >
      <div className="space-y-4 px-2 py-3 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
        <SettingsClient />
      </div>
    </AdminPageShell>
  );
}


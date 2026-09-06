"use client";

import Link from "next/link";
import { LifeBuoy, Settings2 } from "lucide-react";
import SettingsClient from "./settings-client";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <Settings2 size={17} /> Platform operations
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted">Manage platform access, signup controls, notifications, and payment plans</p>
        </div>
        <Link href="/schoolbase-admin/support" className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light sm:self-auto">
          <LifeBuoy className="h-4 w-4" />
          Support help
        </Link>
      </div>
      <SettingsClient />
    </div>
  );
}


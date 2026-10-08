"use client";

import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import SettingsClient from "./settings-client";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <style>{`@keyframes support-page-pulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgb(10 102 194 / .4) } 50% { opacity: .55; box-shadow: 0 0 0 7px rgb(10 102 194 / 0) } } @keyframes support-page-scan { from { transform: translateX(-100%) } to { transform: translateX(100%) } } .support-page-hero { position: relative; overflow: hidden; } .support-page-scan { position: absolute; inset: 0 auto 0 0; width: 33%; background: linear-gradient(to right, transparent, rgb(10 102 194 / .10), transparent); animation: support-page-scan 3.2s linear infinite; pointer-events: none; } .support-page-pulse { animation: support-page-pulse 0.9s ease-in-out infinite; }`}</style>

      <header className="support-page-hero relative overflow-hidden border border-border bg-surface px-6 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
        <div className="support-page-scan" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand">
              <span className="support-page-pulse h-2.5 w-2.5 rounded-full bg-brand" />
              Platform operations
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Manage platform access, signup controls, notifications, and payment plans.</p>
          </div>
          <Link href="/schoolbase-admin/support" className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light sm:self-auto">
            <LifeBuoy className="h-4 w-4" />
            Support help
          </Link>
        </div>
      </header>

      <SettingsClient />
    </div>
  );
}


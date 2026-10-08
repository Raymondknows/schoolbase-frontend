"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Power } from "lucide-react";
import SharedWorkspaceClient from "@/app/schoolbase-admin/shared-workspace-client";

export default function SharedWorkspacePage() {
  const [floatingWorkspaceEnabled, setFloatingWorkspaceEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("schoolbase:shared-workspace-enabled") === "true";
  });

  const toggleFloatingWorkspace = () => {
    const nextEnabled = !floatingWorkspaceEnabled;
    window.localStorage.setItem("schoolbase:shared-workspace-enabled", String(nextEnabled));
    window.dispatchEvent(new Event("schoolbase:shared-workspace-enabled-change"));
    setFloatingWorkspaceEnabled(nextEnabled);
  };

  return (
    <main className="min-h-screen pb-12">
      <style>{`@keyframes shared-workspace-pulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgb(10 102 194 / .4) } 50% { opacity: .55; box-shadow: 0 0 0 7px rgb(10 102 194 / 0) } } @keyframes shared-workspace-scan { from { transform: translateX(-100%) } to { transform: translateX(100%) } } .shared-workspace-hero { position: relative; overflow: hidden; } .shared-workspace-scan { position: absolute; inset: 0 auto 0 0; width: 33%; background: linear-gradient(to right, transparent, rgb(10 102 194 / .10), transparent); animation: shared-workspace-scan 3.2s linear infinite; pointer-events: none; } .shared-workspace-pulse { animation: shared-workspace-pulse 0.9s ease-in-out infinite; }`}</style>
      <div className="mx-auto w-full max-w-7xl space-y-6 overflow-hidden px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
        <header className="shared-workspace-hero relative overflow-hidden border border-border bg-surface px-6 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
          <div className="shared-workspace-scan" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand">
                <span className="shared-workspace-pulse h-2.5 w-2.5 rounded-full bg-brand" />
                Support operations
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Shared workspace</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Coordinate support tasks, ownership, follow-ups, and team execution in one clear operating view.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={toggleFloatingWorkspace} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-brand/50 hover:bg-brand-light">
                <Power className="h-4 w-4 text-brand" />
                {floatingWorkspaceEnabled ? "Disable floating workspace" : "Enable floating workspace"}
              </button>
              <Link href="/schoolbase-admin/support" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light">
                <ArrowLeft className="h-4 w-4" />
                Support inbox
              </Link>
            </div>
          </div>
        </header>

        <SharedWorkspaceClient mode="page" />
      </div>
    </main>
  );
}
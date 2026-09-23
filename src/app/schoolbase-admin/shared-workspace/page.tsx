"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckSquare, Power } from "lucide-react";
import SharedWorkspaceClient from "@/app/schoolbase-admin/shared-workspace-client";

export default function SharedWorkspacePage() {
  const [floatingWorkspaceEnabled, setFloatingWorkspaceEnabled] = useState(false);

  useEffect(() => {
    setFloatingWorkspaceEnabled(window.localStorage.getItem("schoolbase:shared-workspace-enabled") === "true");
  }, []);

  const toggleFloatingWorkspace = () => {
    const nextEnabled = !floatingWorkspaceEnabled;
    window.localStorage.setItem("schoolbase:shared-workspace-enabled", String(nextEnabled));
    window.dispatchEvent(new Event("schoolbase:shared-workspace-enabled-change"));
    setFloatingWorkspaceEnabled(nextEnabled);
  };

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand"><CheckSquare className="h-[17px] w-[17px]" /> Support operations</div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Shared workspace</h1>
          <p className="mt-1 text-muted">Coordinate support tasks, ownership, and follow-up work across the team</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={toggleFloatingWorkspace} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-brand/50 hover:bg-brand-light">
            <Power className="h-4 w-4 text-brand" />
            {floatingWorkspaceEnabled ? "Disable floating workspace" : "Enable floating workspace"}
          </button>
          <Link href="/schoolbase-admin/support" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"><ArrowLeft className="h-4 w-4" /> Support inbox</Link>
        </div>
      </div>
      <SharedWorkspaceClient mode="page" />
      </div>
    </main>
  );
}
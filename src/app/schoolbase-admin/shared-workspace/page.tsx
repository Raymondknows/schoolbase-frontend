import Link from "next/link";
import { ArrowLeft, CheckSquare } from "lucide-react";
import SharedWorkspaceClient from "@/app/schoolbase-admin/shared-workspace-client";

export default function SharedWorkspacePage() {
  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand"><CheckSquare className="h-[17px] w-[17px]" /> Support operations</div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Shared workspace</h1>
          <p className="mt-1 text-muted">Coordinate support tasks, ownership, and follow-up work across the team</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/schoolbase-admin/support" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"><ArrowLeft className="h-4 w-4" /> Support inbox</Link>
        </div>
      </div>
      <SharedWorkspaceClient mode="page" />
      </div>
    </main>
  );
}
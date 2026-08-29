"use client";

import { useState } from "react";
import Link from "next/link";
import { LifeBuoy, Upload } from "lucide-react";
import AdminPageShell from "@/components/admin-page-shell";
import VideosClient from "./videos-client";

export default function VideoLibraryPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);

  return (
    <AdminPageShell
      title="Video Library"
      subtitle="Training, onboarding, and practical how-to videos for your school operations"
      actions={
        <>
          <Link
            href="/schoolbase-admin/support"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface"
          >
            <LifeBuoy className="h-4 w-4" />
            Support help
          </Link>
          <button
            type="button"
            onClick={() => setShowUploadForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
          >
            <Upload className="h-4 w-4" />
            Upload video
          </button>
        </>
      }
    >
      <div className="space-y-5 px-0 py-1 sm:px-1 lg:px-2">
        <VideosClient
          initialVideos={[]}
          showForm={showUploadForm}
          onShowForm={() => setShowUploadForm(true)}
          onHideForm={() => setShowUploadForm(false)}
        />
      </div>
    </AdminPageShell>
  );
}

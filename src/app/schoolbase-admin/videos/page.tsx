"use client";

import { useState } from "react";
import Link from "next/link";
import { LifeBuoy, PlayCircle, Upload } from "lucide-react";
import VideosClient from "./videos-client";

export default function VideoLibraryPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <PlayCircle size={17} /> Content operations
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Video Library</h1>
          <p className="mt-1 text-muted">Publish training, onboarding, and practical how-to videos for school teams</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/schoolbase-admin/support" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light">
            <LifeBuoy className="h-4 w-4" /> Support help
          </Link>
          <button type="button" onClick={() => setShowUploadForm(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover">
            <Upload className="h-4 w-4" /> Upload video
          </button>
        </div>
      </div>
      <VideosClient
        initialVideos={[]}
        showForm={showUploadForm}
        onShowForm={() => setShowUploadForm(true)}
        onHideForm={() => setShowUploadForm(false)}
      />
    </div>
  );
}

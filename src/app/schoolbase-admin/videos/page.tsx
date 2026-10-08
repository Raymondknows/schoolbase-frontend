"use client";

import { useState } from "react";
import Link from "next/link";
import { LifeBuoy, Upload } from "lucide-react";
import VideosClient from "./videos-client";

export default function VideoLibraryPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <style>{`@keyframes support-page-pulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgb(10 102 194 / .4) } 50% { opacity: .55; box-shadow: 0 0 0 7px rgb(10 102 194 / 0) } } @keyframes support-page-scan { from { transform: translateX(-100%) } to { transform: translateX(100%) } } .support-page-hero { position: relative; overflow: hidden; } .support-page-scan { position: absolute; inset: 0 auto 0 0; width: 33%; background: linear-gradient(to right, transparent, rgb(10 102 194 / .10), transparent); animation: support-page-scan 3.2s linear infinite; pointer-events: none; } .support-page-pulse { animation: support-page-pulse 0.9s ease-in-out infinite; }`}</style>

      <header className="support-page-hero relative overflow-hidden border border-border bg-surface px-6 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
        <div className="support-page-scan" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand">
              <span className="support-page-pulse h-2.5 w-2.5 rounded-full bg-brand" />
              Content operations
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Video Library</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Publish training, onboarding, and practical how-to videos for school teams.</p>
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
      </header>

      <VideosClient
        initialVideos={[]}
        showForm={showUploadForm}
        onShowForm={() => setShowUploadForm(true)}
        onHideForm={() => setShowUploadForm(false)}
      />
    </div>
  );
}

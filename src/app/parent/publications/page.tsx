"use client";

import { useEffect, useState } from "react";
import { BookOpen, AlertCircle, X } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import ParentPageShell from "@/components/parent-page-shell";
interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt?: string;
  createdAt: string;
}

type ViewMode = "grid" | "list";

export default function PublicationsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const loadData = async () => {
    try {
      const backendUrl = getBackendUrl();
      
      const res = await fetch(`${backendUrl}/api/parent/announcements`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to load publications');
      }

      const data = await res.json();
      setAnnouncements(data.announcements || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading publications:", err);
      setError(err instanceof Error ? err.message : 'Failed to load publications');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="h-5 w-64 bg-slate-100 rounded animate-pulse"></div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border bg-surface p-4 space-y-3 animate-pulse">
              <div className="h-5 w-32 bg-slate-200 rounded"></div>
              <div className="h-4 w-48 bg-slate-100 rounded"></div>
              <div className="h-20 w-full bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      </ParentPageShell>
    );
  }

  const getExcerpt = (body: string | undefined, length: number = 150) => {
    if (!body) return "";
    return body.length > length ? body.substring(0, length) + "..." : body;
  };

  const getReadingTime = (body: string | undefined) => {
    if (!body) return 1;
    const wordsPerMinute = 200;
    const wordCount = body.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes;
  };

  return (
    <ParentPageShell onRefresh={loadData}>
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
          <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand"><BookOpen className="h-4 w-4" /> School communications</div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">School Publications</h1>
          <p className="mt-1 text-sm text-muted">Latest news and updates from your school</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-[.12em] text-muted">{announcements.length} updates</span>
        </div>

      {error && (
        <div className="rounded-lg border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-sm text-[#a61b29] flex gap-3">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-error">Error</h3>
            <p className="text-sm text-error/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Publications List */}
        {announcements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] p-14 text-center">
            <BookOpen className="mx-auto mb-4 h-8 w-8 text-brand" />
            <p className="text-sm font-semibold text-foreground">No publications yet</p>
            <p className="text-sm text-muted/70 mt-2">Check back soon for school updates</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="border-b border-border bg-[#f6f8fa] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Communications board</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Latest school updates</p>
            </div>
            {announcements.map((publication) => (
              <button
                key={publication.id}
                onClick={() => setSelectedAnnouncement(publication)}
                className="w-full border-b border-border px-4 py-4 text-left transition last:border-0 hover:bg-background"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="text-[11px] font-bold uppercase tracking-[.12em] text-brand">News</span>
                      <span className="text-[11px] text-muted">
                        {getReadingTime(publication.body)} min read
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold text-foreground truncate">{publication.title}</h2>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{getExcerpt(publication.body, 180)}</p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-semibold text-foreground">{new Date(publication.publishedAt || publication.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}</p>
                    <span className="mt-2 inline-flex items-center text-xs font-semibold text-brand">Read <span className="ml-1">›</span></span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]">
            {/* Modal Header */}
            <div className="sticky top-0 flex flex-col gap-3 border-b border-border bg-[#f6f8fa] p-5">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[.12em] text-brand">News</span>
                <span className="text-xs text-muted">
                  {getReadingTime(selectedAnnouncement.body)} min read
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-bold text-foreground">{selectedAnnouncement.title}</h2>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="flex-shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 p-5">
              {/* Publication Date */}
              <div className="flex flex-col gap-2 text-sm text-muted/70 pb-4 border-b border-border/50">
                <span className="font-semibold text-foreground">Published on</span>
                <time>
                  {new Date(selectedAnnouncement.publishedAt || selectedAnnouncement.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>

              {/* Full Content */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="text-foreground leading-relaxed whitespace-pre-wrap text-base">
                  {selectedAnnouncement.body}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 flex flex-col gap-3 border-t border-border bg-[#f6f8fa] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted">
                {announcements.findIndex(a => a.id === selectedAnnouncement.id) + 1} of {announcements.length}
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ParentPageShell>
  );
}

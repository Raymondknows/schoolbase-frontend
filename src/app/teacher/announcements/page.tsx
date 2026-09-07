'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Megaphone, Grid3x3, List, X } from 'lucide-react';
import { getBackendUrl } from '@/lib/backend-url';

interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt?: string;
  createdAt?: string;
}

interface Message {
  id: string;
  sender: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  type?: string;
}

type ViewMode = "grid" | "list";

export default function AnnouncementsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Message | null>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/teacher/announcements`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch announcements: ${response.statusText}`);
        }

        const data = await response.json();
        // Transform announcements to message format
        const transformedMessages: Message[] = (data.announcements || []).map((ann: Announcement) => ({
          id: ann.id,
          sender: 'School Administration',
          subject: ann.title,
          body: ann.body,
          timestamp: ann.publishedAt || ann.createdAt || new Date().toISOString(),
          read: false,
          type: 'announcement',
        }));
        setMessages(transformedMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load announcements');
        console.error('Error fetching announcements:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-muted">Loading announcements...</p>
        </div>
      </div>
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
    <main className="min-h-screen pb-12">
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <Megaphone className="h-[17px] w-[17px]" /> Teacher workspace
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">School Announcements</h1>
          <p className="mt-1 text-muted">Important updates and news from your school.</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 border border-border bg-surface p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded transition-colors ${
              viewMode === "grid"
                ? "bg-brand text-white"
                : "text-muted hover:text-foreground"
            }`}
            title="Grid view"
          >
            <Grid3x3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded transition-colors ${
              viewMode === "list"
                ? "bg-brand text-white"
                : "text-muted hover:text-foreground"
            }`}
            title="List view"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Announcements List */}
      <section className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">School communications</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Latest announcements</h2>
          </div>
          <span className="text-sm font-semibold text-muted">{messages.length} {messages.length === 1 ? 'update' : 'updates'}</span>
        </div>
      </section>

      {messages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] p-16 text-center">
          <Megaphone className="h-16 w-16 text-muted/40 mx-auto mb-4" />
          <p className="text-lg text-muted">No announcements yet</p>
          <p className="text-sm text-muted/70 mt-2">Check back soon for important updates</p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {messages.map((msg) => (
            <article
              key={msg.id}
              className="border border-border bg-surface transition hover:border-brand/40 hover:bg-brand-light flex flex-col group"
            >
              {/* Featured Image / Header */}
              <div className="flex h-16 items-center gap-3 border-b border-border bg-background px-5">
                <Megaphone className="h-5 w-5 text-brand" />
                <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">School update</p>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-5">
                {/* Category/Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block border border-brand/30 bg-brand/10 px-2.5 py-1 text-brand text-xs font-semibold uppercase tracking-wider">
                    Announcement
                  </span>
                  <span className="text-xs text-muted">
                    {getReadingTime(msg.body)} min read
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg font-bold text-foreground mb-3 line-clamp-2 group-hover:text-brand transition-colors">
                  {msg.subject}
                </h2>

                {/* Excerpt */}
                <p className="text-sm text-muted leading-relaxed mb-4 flex-1 line-clamp-3">
                  {getExcerpt(msg.body)}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <time className="text-xs text-muted/70">
                    {new Date(msg.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                  <button 
                    onClick={() => setSelectedAnnouncement(msg)}
                    className="text-xs font-semibold text-brand hover:text-brand/80 transition-colors"
                  >
                    Read more
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {messages.map((msg) => (
            <article
              key={msg.id}
              className="border border-border bg-surface transition hover:border-brand/40 hover:bg-brand-light group"
            >
              <div className="flex gap-5 p-5">
                {/* Featured Visual */}
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center border border-border bg-background">
                  <Megaphone className="h-7 w-7 text-brand" />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-block border border-brand/30 bg-brand/10 px-2.5 py-1 text-brand text-xs font-semibold uppercase tracking-wider">
                        Announcement
                      </span>
                      <span className="text-xs text-muted">
                        {getReadingTime(msg.body)} min read
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-brand transition-colors">
                      {msg.subject}
                    </h2>

                    <p className="text-muted leading-relaxed mb-4">
                      {getExcerpt(msg.body, 250)}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <time className="text-sm text-muted/70">
                      {new Date(msg.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                    <button 
                      onClick={() => setSelectedAnnouncement(msg)}
                      className="text-sm font-semibold text-brand hover:text-brand/80 transition-colors"
                    >
                      Read full announcement
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Full Announcement Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50 sticky top-0 bg-surface">
              <h2 className="text-2xl font-bold text-foreground">{selectedAnnouncement.subject}</h2>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-muted">
                <span>{selectedAnnouncement.sender}</span>
                <span>•</span>
                <time>
                  {new Date(selectedAnnouncement.timestamp).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>

              {/* Content */}
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                {selectedAnnouncement.body}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border/50 bg-surface/50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-background transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </main>
  );
}
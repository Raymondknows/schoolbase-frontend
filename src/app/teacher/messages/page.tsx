'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Megaphone, Grid3x3, List } from 'lucide-react';
import { getBackendUrl } from '@/lib/backend-url';
import AdminSkeleton from '@/components/ui/skeleton';
import TeacherPageHeader from '@/components/teacher-page-header';

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
    return <AdminSkeleton />;
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
    <div className="space-y-8">
      <TeacherPageHeader icon={Megaphone} title="School Announcements" description="Important updates and news from your school." count={`${messages.length} updates`}>
        <div className="flex items-center gap-2 border border-border bg-background p-1">
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
      </TeacherPageHeader>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Announcements List */}
      {messages.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-16 text-center">
          <Megaphone className="h-16 w-16 text-muted/40 mx-auto mb-4" />
          <p className="text-lg text-muted">No announcements yet</p>
          <p className="text-sm text-muted/70 mt-2">Check back soon for important updates</p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {messages.map((msg) => (
            <article
              key={msg.id}
              className="rounded-xl border border-border bg-surface overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              {/* Featured Image / Header */}
              <div className="h-48 bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center overflow-hidden relative group-hover:from-brand/30 group-hover:to-brand/10 transition-all">
                <div className="text-center px-4">
                  <div className="text-5xl mb-2">📢</div>
                  <p className="text-sm text-muted/70 line-clamp-2">{msg.subject}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                {/* Category/Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold uppercase tracking-wider">
                    Announcement
                  </span>
                  <span className="text-xs text-muted">
                    {getReadingTime(msg.body)} min read
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-brand transition-colors">
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
                  <button className="text-xs font-semibold text-brand hover:text-brand/80 transition-colors">
                    Read More →
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
              className="rounded-xl border border-border bg-surface overflow-hidden hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex gap-6 p-6">
                {/* Featured Visual */}
                <div className="flex-shrink-0 w-32 h-32 rounded-lg bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center overflow-hidden group-hover:from-brand/30 group-hover:to-brand/10 transition-all">
                  <div className="text-4xl">📢</div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold uppercase tracking-wider">
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
                    <button className="text-sm font-semibold text-brand hover:text-brand/80 transition-colors">
                      Read Full Announcement →
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

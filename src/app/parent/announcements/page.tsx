"use client";

import { useEffect, useState } from "react";
import { Bell, AlertCircle } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import ParentPageShell from "@/components/parent-page-shell";
import ParentPageHeader from "@/components/parent-page-header";
interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt?: string;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const backendUrl = getBackendUrl();
      
      const res = await fetch(`${backendUrl}/api/parent/announcements`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to load announcements');
      }

      const data = await res.json();
      setAnnouncements(data.announcements || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading announcements:", err);
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-6 space-y-3 animate-pulse">
              <div className="h-5 w-32 bg-slate-200 rounded"></div>
              <div className="h-4 w-24 bg-slate-100 rounded"></div>
              <div className="h-16 w-full bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      </ParentPageShell>
    );
  }

  return (
    <ParentPageShell onRefresh={loadData}>
      <ParentPageHeader icon={Bell} eyebrow="School communications" title="School Announcements" description="Important updates and messages from your school community." count={`${announcements.length} updates`} />

      {error && (
        <div className="rounded-lg border border-error bg-error/10 p-4 flex gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-error">Error</h3>
            <p className="text-sm text-error/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <Bell className="h-12 w-12 text-muted mx-auto mb-3" />
          <p className="text-muted">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="rounded-lg border border-border bg-surface p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{announcement.title}</h3>
                  <p className="text-xs text-muted/70 mt-1">
                    {new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-foreground leading-relaxed text-sm">
                {announcement.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </ParentPageShell>
  );
}

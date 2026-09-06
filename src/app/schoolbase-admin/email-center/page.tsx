"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, LifeBuoy, Mail } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import EmailCenterClient from "./email-center-client";

interface School {
  id: string;
  name: string;
  email?: string;
  createdAt: string;
}

export default function EmailCenterPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    async function fetchSchools() {
      try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/schoolbase-admin/api/schools?limit=1000`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSchools(data.schools || []);
        }
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        setSchools([]);
      }
    }

    fetchSchools();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand"><Mail size={17} /> Communication operations</div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Email Center</h1>
          <p className="mt-1 text-muted">Send professional updates, reminders, and announcements to schools</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/schoolbase-admin/setup-reminders" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"><BellRing className="h-4 w-4" /> Setup reminders</Link>
          <Link href="/schoolbase-admin/support" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"><LifeBuoy className="h-4 w-4" /> Support inbox</Link>
          <button type="button" onClick={() => setComposeOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"><Mail className="h-4 w-4" /> Compose email</button>
        </div>
      </div>
      <EmailCenterClient initialSchools={schools} initialEmailLogs={[]} composeOpen={composeOpen} onOpenComposer={() => setComposeOpen(true)} onCloseComposer={() => setComposeOpen(false)} />
    </div>
  );
}

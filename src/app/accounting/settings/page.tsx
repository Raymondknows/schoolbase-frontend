'use client';

import { useEffect, useState } from 'react';
import { Settings, ShieldCheck } from 'lucide-react';
import AdminSkeleton from '@/components/ui/skeleton';

interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export default function SettingsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setSession(data.user ?? data.session ?? null);
        } else {
          const stored = localStorage.getItem('session');
          if (stored) setSession(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    };
    getSession();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-background"><AdminSkeleton /></div>;
  }

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
        <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand"><Settings size={16} /> Accounting workspace</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Manage your bursar account details and session security.</p>
          </div>
        </header>

        <section className="border border-border bg-surface p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-border pb-4 text-brand">
            <ShieldCheck className="h-4 w-4" />
            <div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Identity and access</p><h2 className="mt-1 text-lg font-semibold text-foreground">Account information</h2></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-border bg-background p-4"><p className="mb-1 text-sm text-muted">Name</p><p className="text-lg font-medium text-foreground">{session?.name || 'N/A'}</p></div>
            <div className="border border-border bg-background p-4"><p className="mb-1 text-sm text-muted">Email</p><p className="text-lg font-medium text-foreground">{session?.email || 'N/A'}</p></div>
            <div className="border border-border bg-background p-4"><p className="mb-1 text-sm text-muted">Role</p><p className="text-lg font-medium text-foreground">{session?.role || 'N/A'}</p></div>
            <div className="border border-border bg-background p-4"><p className="mb-1 text-sm text-muted">User ID</p><p className="font-mono text-sm text-muted">{session?.userId || 'N/A'}</p></div>
          </div>
        </section>

      </div>
    </main>
  );
}

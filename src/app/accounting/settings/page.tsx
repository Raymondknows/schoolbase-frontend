'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Loader2,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const currentSession = data.user ?? data.session ?? null;
          setSession(currentSession);
        } else {
          const stored = localStorage.getItem('session');
          if (stored) {
            setSession(JSON.parse(stored));
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand" />
          <p className="text-sm text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <Settings size={17} /> Accounting
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Manage your bursar account details and session security
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-2 text-brand">
          <ShieldCheck className="h-4 w-4" />
          <h2 className="text-lg font-semibold text-foreground">Account Information</h2>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-background p-4">
            <p className="mb-1 text-sm text-muted">Name</p>
            <p className="text-lg font-medium text-foreground">{session?.name || 'N/A'}</p>
          </div>

          <div className="rounded-lg bg-background p-4">
            <p className="mb-1 text-sm text-muted">Email</p>
            <p className="text-lg font-medium text-foreground">{session?.email || 'N/A'}</p>
          </div>

          <div className="rounded-lg bg-background p-4">
            <p className="mb-1 text-sm text-muted">Role</p>
            <p className="text-lg font-medium text-foreground">{session?.role || 'N/A'}</p>
          </div>

          <div className="rounded-lg bg-background p-4">
            <p className="mb-1 text-sm text-muted">User ID</p>
            <p className="font-mono text-sm text-muted">{session?.userId || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-destructive">Danger Zone</h2>

        <div className="space-y-4">
          <p className="text-sm text-muted">
            Sign out of your bursar account. You will need to log in again to access the accounting portal.
          </p>

          <Button onClick={handleLogout} disabled={loggingOut} variant="destructive" className="inline-flex items-center gap-2">
            {loggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Sign Out
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Mail,
  Shield,
  Calendar,
  Building2,
  Loader2,
  User,
  KeyRound,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { getBackendUrl } from '@/lib/backend-url';
import { playCloseTone, playOpenTone } from '@/lib/sounds';

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  school: {
    name: string;
    slug: string;
  };
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const backendUrl = getBackendUrl();

        const res = await fetch(`${backendUrl}/api/teacher/profile`, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Failed to load profile');
        }

        const data = await res.json();
        setProfile(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordError(null);
    setPasswordSuccess(false);

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError('All fields are required.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setChangingPassword(true);

    try {
      const backendUrl = getBackendUrl();

      const res = await fetch(`${backendUrl}/api/teacher/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to change password');
      }

      setPasswordSuccess(true);

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => {
        playCloseTone();
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 1600);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    setShowPasswordModal(true);
    playOpenTone();
  };

  const closePasswordModal = () => {
    if (changingPassword) return;

    playCloseTone();
    setShowPasswordModal(false);
    setPasswordError(null);
    setPasswordSuccess(false);

    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen pb-12">
        <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-muted">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
              Loading your profile...
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen pb-12">
        <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
          <div className="flex items-start gap-3 border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-medium text-red-900">
                Unable to load profile
              </p>
              <p className="mt-1 text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <div className="px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
        <div className="mx-auto max-w-7xl space-y-6 px-5 py-20 text-center">
          <User className="mx-auto h-10 w-10 text-muted/40" />
          <p className="mt-3 text-sm text-muted">
            No profile information available.
          </p>
        </div>
      </div>
    );
  }

  const initials = profile.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const joinedDate = new Date(profile.createdAt).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  );

  return (
<main className="min-h-screen pb-12">
  <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">

        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-brand">
              <User className="h-[17px] w-[17px]" /> Teacher workspace
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Profile</h1>
            <p className="mt-1 text-muted">Manage your teacher account and security.</p>
          </div>
        </div>

        {/* Main profile header */}
        <section className="border border-border bg-surface">

          {/* Brand header */}
          <div className="border-b border-border bg-background px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-muted">Account identity</div>

          {/* Profile identity */}
          <div className="px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand sm:h-20 sm:w-20">
                  <span className="text-3xl font-bold sm:text-4xl">
                    {initials || 'T'}
                  </span>
                </div>

                <div className="pb-1">
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                    {profile.name}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                      {profile.role}
                    </span>

                    <span className="text-xs text-muted">
                      Teacher account
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted">
                <Building2 className="h-4 w-4" />
                <span>{profile.school.name}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Account details */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Account details
            </h2>

            <p className="mt-1 text-sm text-muted">
              Information associated with your SchoolBase account.
            </p>
          </div>

          <div className="divide-y divide-border border border-border bg-surface">

            {/* Email */}
            <div className="flex flex-col gap-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-muted">
                  <Mail className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground">
                    Email address
                  </p>
                  <p className="mt-0.5 text-sm text-muted break-all">
                    {profile.email}
                  </p>
                </div>
              </div>

              <span className="ml-14 inline-flex w-fit items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:ml-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active
              </span>
            </div>

            {/* School */}
            <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-muted">
                <Building2 className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  School
                </p>

                <p className="mt-0.5 truncate text-sm text-muted">
                  {profile.school.name}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-muted">
                <Shield className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">
                  Role
                </p>

                <p className="mt-0.5 text-sm capitalize text-muted">
                  {profile.role}
                </p>
              </div>
            </div>

            {/* Joined */}
            <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-muted">
                <Calendar className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">
                  Account created
                </p>

                <p className="mt-0.5 text-sm text-muted">
                  {joinedDate}
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Security */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Security
            </h2>

            <p className="mt-1 text-sm text-muted">
              Protect your account and manage your sign-in credentials.
            </p>
          </div>

          <div className="overflow-hidden border border-border bg-surface">

            <button
              type="button"
              onClick={openPasswordModal}
              className="group flex w-full items-center gap-4 px-5 py-5 text-left transition hover:bg-background sm:px-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <KeyRound className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                  Change password
                </p>

                <p className="mt-1 text-sm text-muted">
                  Update your password whenever you need to.
                </p>
              </div>

              <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1" />
            </button>

          </div>
        </section>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closePasswordModal();
            }
          }}
        >
          <style>{`
            @keyframes profile_password_modal_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
            @keyframes profile_password_modal_exit  { from { transform: translateX(0) scale(1); opacity: 1 } to { transform: translateX(36px) scale(.98); opacity: 0 } }
          `}</style>

          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
            role="dialog"
            aria-modal="true"
            style={{ animation: `profile_password_modal_enter 320ms cubic-bezier(.2,.9,.2,1)` }}
          >
            <div className="border-b border-slate-100 px-6 py-5" style={{ background: 'linear-gradient(90deg, rgba(10,102,194,0.12), rgba(10,102,194,0.04))' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Change password
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Enter your current password and choose a new one.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={changingPassword}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-background transition-colors text-muted"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={handleChangePassword}
              className="space-y-4 px-6 py-6"
            >
              {passwordError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-sm text-red-800">
                    {passwordError}
                  </p>
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm text-emerald-800">
                    Password changed successfully.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Current password
                </label>

                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  New password
                </label>

                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />

                <p className="mt-1.5 text-xs text-muted">
                  Minimum 8 characters.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Confirm new password
                </label>

                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </div>

              <div className="flex gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={changingPassword}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  UserCircle,
  Users,
} from 'lucide-react';
import TeacherPageHeader from '@/components/teacher-page-header';
import AdminSkeleton from '@/components/ui/skeleton';
import { getBackendUrl } from '@/lib/backend-url';

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  school?: { name?: string; slug?: string };
  createdAt?: string;
}

interface TeacherClass {
  id: string;
  name?: string;
  level?: string;
}

interface TeacherAssessment {
  id: string;
  name?: string;
  status?: string;
}

const preferenceDefaults = {
  lessonReminders: true,
  resultUpdates: true,
  attendanceReminders: true,
};

export default function TeacherSettingsPage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [assessments, setAssessments] = useState<TeacherAssessment[]>([]);
  const [preferences, setPreferences] = useState(preferenceDefaults);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    setError(null);
    try {
      const backendUrl = getBackendUrl();
      const [profileResponse, classesResponse, assessmentsResponse] = await Promise.all([
        fetch(`${backendUrl}/api/teacher/profile`, { credentials: 'include', cache: 'no-store' }),
        fetch(`${backendUrl}/api/teacher/classes`, { credentials: 'include', cache: 'no-store' }),
        fetch(`${backendUrl}/api/teacher/assessments`, { credentials: 'include', cache: 'no-store' }),
      ]);
      const [profileData, classesData, assessmentsData] = await Promise.all([
        profileResponse.json().catch(() => ({})),
        classesResponse.json().catch(() => ({})),
        assessmentsResponse.json().catch(() => ({})),
      ]);
      if (!profileResponse.ok) throw new Error(profileData.error || 'Unable to load teacher settings.');
      setProfile(profileData);
      if (classesResponse.ok) setClasses(Array.isArray(classesData.classes) ? classesData.classes : Array.isArray(classesData) ? classesData : []);
      if (assessmentsResponse.ok) setAssessments(Array.isArray(assessmentsData.assessments) ? assessmentsData.assessments : Array.isArray(assessmentsData) ? assessmentsData : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load teacher settings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSettings();
    try {
      const stored = localStorage.getItem('schoolbase.teacher.preferences');
      if (stored) setPreferences({ ...preferenceDefaults, ...JSON.parse(stored) });
    } catch {
      // Preferences remain at their safe defaults if local storage is unavailable.
    }
  }, []);

  function updatePreference(key: keyof typeof preferences) {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setSaved(false);
    localStorage.setItem('schoolbase.teacher.preferences', JSON.stringify(next));
    setSaved(true);
  }

  if (loading) return <AdminSkeleton />;

  const quickLinks = [
    { href: '/teacher', label: 'Teacher dashboard', detail: 'Your day at a glance', icon: LayoutDashboard },
    { href: '/teacher/students', label: 'My students', detail: 'Open assigned learner records', icon: Users },
    { href: '/teacher/timetable', label: 'Timetable', detail: 'Review lessons and periods', icon: CalendarDays },
    { href: '/teacher/results', label: 'Results workspace', detail: 'Review assessments and scores', icon: FileText },
  ];
  const metrics: Array<{ label: string; value: string | number; icon: typeof Users }> = [
    { label: 'Assigned classes', value: classes.length, icon: Users },
    { label: 'Available assessments', value: assessments.length, icon: ClipboardList },
    { label: 'School', value: profile?.school?.name || 'SchoolBase', icon: BookOpen },
    { label: 'Access role', value: profile?.role || 'TEACHER', icon: ShieldCheck },
  ];

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 lg:px-12">
        <TeacherPageHeader icon={SettingsIcon} title="Teacher settings" description="Shape your teaching workspace, review your access, and keep your daily tools close." />

        {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

        <div className="flex justify-end">
          <button type="button" onClick={() => { setRefreshing(true); loadSettings(); }} disabled={refreshing} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />{refreshing ? 'Refreshing...' : 'Refresh workspace'}</button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(({ label, value, icon: MetricIcon }) => <article key={label} className="border border-border bg-surface p-5"><MetricIcon className="h-5 w-5 text-brand" /><p className="mt-4 text-xs font-bold uppercase tracking-[.12em] text-muted">{label}</p><p className="mt-1 truncate text-xl font-semibold text-foreground">{value}</p></article>)}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="border border-border bg-surface p-5 sm:p-6"><div className="mb-5 flex items-center gap-3 border-b border-border pb-4"><UserCircle className="h-5 w-5 text-brand" /><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Identity and access</p><h2 className="mt-1 text-lg font-semibold text-foreground">Your teacher account</h2></div></div><div className="grid gap-3 sm:grid-cols-2">{[['Name', profile?.name || 'Not available'], ['Email', profile?.email || 'Not available'], ['Role', profile?.role || 'TEACHER'], ['Account since', profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not available']].map(([label, value]) => <div key={label} className="border border-border bg-background p-4"><p className="text-sm text-muted">{label}</p><p className="mt-1 break-words font-medium text-foreground">{value}</p></div>)}</div><div className="mt-5 flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">Backend authorization remains authoritative</p><p className="mt-1 text-emerald-700">Your role and assigned school scope are checked by the server for every protected teacher request.</p></div></div><Link href="/teacher/profile" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">Open full profile <ChevronRight className="h-4 w-4" /></Link></section>

          <section className="border border-border bg-surface p-5 sm:p-6"><div className="mb-5 flex items-center gap-3 border-b border-border pb-4"><Bell className="h-5 w-5 text-brand" /><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Workspace preferences</p><h2 className="mt-1 text-lg font-semibold text-foreground">Teacher notifications</h2></div></div><div className="space-y-3">{([['lessonReminders', 'Lesson reminders', 'Keep timetable prompts visible.'], ['resultUpdates', 'Result updates', 'Stay aware of assessment workflow changes.'], ['attendanceReminders', 'Attendance reminders', 'Keep daily attendance tasks visible.']] as const).map(([key, label, detail]) => <label key={key} className="flex cursor-pointer items-start gap-3 border border-border bg-background p-3"><input type="checkbox" checked={preferences[key]} onChange={() => updatePreference(key)} className="mt-1 h-4 w-4 accent-[#0A66C2]" /><span><span className="block text-sm font-semibold text-foreground">{label}</span><span className="mt-1 block text-xs text-muted">{detail}</span></span></label>)}</div>{saved && <p className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />Preferences saved on this device.</p>}</section>
        </div>

        <section className="border border-border bg-surface p-5 sm:p-6"><div className="mb-5 flex items-center gap-3 border-b border-border pb-4"><SettingsIcon className="h-5 w-5 text-brand" /><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Teaching workspace</p><h2 className="mt-1 text-lg font-semibold text-foreground">Quick access</h2></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{quickLinks.map(({ href, label, detail, icon: Icon }) => <Link key={href} href={href} className="group border border-border bg-background p-4 transition hover:border-brand hover:bg-brand-light/30"><Icon className="h-5 w-5 text-brand" /><p className="mt-4 text-sm font-semibold text-foreground">{label}</p><p className="mt-1 text-xs text-muted">{detail}</p><ChevronRight className="mt-4 h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" /></Link>)}</div></section>

        <section className="border border-border bg-surface p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-brand" /><div><h2 className="text-lg font-semibold text-foreground">Password and sign-in security</h2><p className="mt-1 text-sm text-muted">Use the profile page to change your password. Choose a unique password and never share it in messages or support requests.</p></div></div><Link href="/teacher/profile" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">Manage password <KeyRound className="h-4 w-4" /></Link></div></section>
      </div>
    </main>
  );
}

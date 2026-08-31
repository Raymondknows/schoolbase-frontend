"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CreditCard, Users, Layers, TrendingUp, ArrowUpRight, Clock, ChevronLeft, ChevronRight, DollarSign, BookOpen, MessageSquare, Plus, CheckCircle2, LayoutDashboard } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";
import AdminSkeleton from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { getBackendUrl } from "@/lib/backend-url";
import SubscriptionModal from "@/components/subscription-modal";
import { useRouter, useSearchParams } from "next/navigation";

const whatsAppWiggleStyle = `
  @keyframes whatsapp-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.9; }
  }
  .whatsapp-pulse {
    animation: whatsapp-pulse 2s ease-in-out infinite;
  }
`;

const dashboardSectionThemes = [
  {
    shell: "border border-border bg-surface",
    iconWrap: "bg-brand/10",
    iconColor: "text-brand",
    badge: "border border-border bg-background text-muted",
    link: "text-brand hover:text-brand/80",
    row: "border-l-4 border-l-brand/80 bg-brand-light/20",
  },
  {
    shell: "border border-border bg-surface",
    iconWrap: "bg-brand/10",
    iconColor: "text-brand",
    badge: "border border-border bg-background text-muted",
    link: "text-brand hover:text-brand/80",
    row: "border-l-4 border-l-brand/80 bg-brand-light/20",
  },
  {
    shell: "border border-border bg-surface",
    iconWrap: "bg-brand/10",
    iconColor: "text-brand",
    badge: "border border-border bg-background text-muted",
    link: "text-brand hover:text-brand/80",
    row: "border-l-4 border-l-brand/80 bg-brand-light/20",
  },
  {
    shell: "border border-border bg-surface",
    iconWrap: "bg-brand/10",
    iconColor: "text-brand",
    badge: "border border-border bg-background text-muted",
    link: "text-brand hover:text-brand/80",
    row: "border-l-4 border-l-brand/80 bg-brand-light/20",
  },
] as const;

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [schoolName, setSchoolName] = useState<string>('');
  const [detectedCountryName, setDetectedCountryName] = useState<string | null>(null);
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<{ reason: string; schoolName?: string } | null>(null);
  const [cardScroll, setCardScroll] = useState(0);
  const [whatsAppConnected, setWhatsAppConnected] = useState<boolean | null>(null);
  const [whatsAppStatusMessage, setWhatsAppStatusMessage] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const handleRefresh = () => setRefreshNonce((value) => value + 1);
    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        handleRefresh();
      }
    });

    return () => {
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const backendUrl = getBackendUrl();
        console.log('[Dashboard] Loading from:', backendUrl);
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          // Fetch all data in parallel
          const [feesRes, studentsRes, classesRes, teachersRes, verifyRes] = await Promise.all([
            fetch(`${backendUrl}/api/admin/fees/data`, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
            }).catch(err => {
              console.error('[Dashboard] Fees fetch error:', err.message);
              throw err;
            }),
            fetch(`${backendUrl}/api/admin/students/data`, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
            }).catch(err => {
              console.error('[Dashboard] Students fetch error:', err.message);
              throw err;
            }),
            fetch(`${backendUrl}/api/admin/classes/data`, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
            }).catch(err => {
              console.error('[Dashboard] Classes fetch error:', err.message);
              throw err;
            }),
            fetch(`${backendUrl}/api/admin/teachers/data`, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
            }).catch(err => {
              console.error('[Dashboard] Teachers fetch error:', err.message);
              throw err;
            }),
            fetch(`${backendUrl}/api/admin/verify`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
            }).catch(err => {
              console.error('[Dashboard] Verify fetch error:', err.message);
              throw err;
            }),
          ]);

          clearTimeout(timeoutId);

          let verifyData: any = null;
          try {
            verifyData = await verifyRes.json();
          } catch {
            verifyData = null;
          }

          console.log('[Dashboard] Data loaded successfully');

          // Extract school name - fetch the full school object just like the sidebar does
          let schoolNameToUse = '';
          if (verifyData?.authenticated && verifyData.session?.schoolId) {
            try {
              const schoolRes = await fetch(`${backendUrl}/api/admin/school/${verifyData.session.schoolId}`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
              });
              if (schoolRes.ok) {
                const schoolData = await schoolRes.json();
                schoolNameToUse = schoolData?.name || '';
              }
            } catch (err) {
              console.error('[Dashboard] Error fetching school:', err);
            }
          }

          // Check for subscription blocking before loading the dashboard content.
          for (const res of [feesRes, studentsRes, classesRes, teachersRes]) {
            if (res.status === 403) {
              const errorBody = await res.json().catch(() => null);
              if (errorBody?.code === 'SUBSCRIPTION_INACTIVE') {
                setSubscriptionBlocked({
                  reason: errorBody.reason || 'Your school subscription is not active',
                  schoolName: schoolNameToUse || undefined,
                });
                setSchoolName(schoolNameToUse);
                setLoading(false);
                return;
              }
            }
          }

          const [feesData, studentsData, classesData, teachersData] = await Promise.all([
            feesRes.json(),
            studentsRes.json(),
            classesRes.json(),
            teachersRes.json(),
          ]);

          let setupStatus: { isComplete?: boolean; completionPercentage?: number } | null = null;
          if (verifyData?.authenticated && verifyData.session?.schoolId) {
            try {
              const setupStatusRes = await fetch(`/api/admin/school/${verifyData.session.schoolId}/setup-status`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
              });
              if (setupStatusRes.ok) {
                setupStatus = await setupStatusRes.json();
              }
            } catch (err) {
              console.error('[Dashboard] Setup status fetch error:', err);
            }
          }

          let countryConfig: any = null;
          try {
            const countryRes = await fetch("/api/country/config");
            if (countryRes.ok) {
              countryConfig = await countryRes.json();
            }
          } catch (err) {
            console.error('[Dashboard] Country config fetch error:', err);
          }

          const dashboardCurrency = countryConfig?.data?.currency || feesData.currency || "NGN";
          const dashboardCountryName = countryConfig?.data?.name || null;
          const dashboardCountryCode = countryConfig?.country || null;

          // Get WhatsApp connection status if available
          try {
            const whatsappRes = await fetch(`/api/admin/whatsapp/status`, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
            });
            if (whatsappRes.ok) {
              const whatsappData = await whatsappRes.json();
              setWhatsAppConnected(whatsappData?.session?.status === 'connected');
              setWhatsAppStatusMessage(whatsappData?.session?.statusMessage || whatsappData?.session?.status || null);
            } else {
              setWhatsAppConnected(false);
              setWhatsAppStatusMessage('Unable to retrieve WhatsApp status.');
            }
          } catch (err) {
            console.error('[Dashboard] WhatsApp status fetch error:', err);
            setWhatsAppConnected(false);
            setWhatsAppStatusMessage('Unable to retrieve WhatsApp status.');
          }

          // Count active pupils
          const pupils = studentsData.pupils || [];
          const pupilCount = pupils.filter((p: any) => p.isActive).length;
          const classCount = (classesData.classes || []).length;
          
          // Get recent pupils (last 3 added)
          const recentPupils = pupils
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
        
        // Get recent teachers (last 3 added)
        const recentTeachers = (teachersData.teachers || [])
          .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 3);
        
        // Fetch announcements data
        let announcements = [];
        try {
          const announcementsRes = await fetch(`${backendUrl}/api/admin/announcements`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          if (announcementsRes.ok) {
            const announcementsData = await announcementsRes.json();
            announcements = announcementsData.announcements || [];
          }
        } catch (err) {
          console.error('Error fetching announcements:', err);
        }
        
        // Fetch recent payments data
        let recentPayments = [];
        try {
          const paymentsRes = await fetch(`${backendUrl}/api/admin/payments/recent`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          if (paymentsRes.ok) {
            const paymentsData = await paymentsRes.json();
            recentPayments = paymentsData.payments || [];
          }
        } catch (err) {
          console.error('Error fetching recent payments:', err);
        }
        
        // Set dashboard data
        setDashboardData({
          outstanding: feesData.outstanding || 0,
          attentionCount: feesData.invoices?.filter((inv: any) => 
            ['SENT', 'PART_PAID', 'OVERDUE'].includes(inv.status)
          ).length || 0,
          pupilCount,
          classCount,
          recentPayments,
          recentPupils,
          recentTeachers,
          recentAnnouncements: announcements,
          currency: dashboardCurrency,
        });
        const setupComplete = setupStatus?.isComplete === true;
        const setupIncomplete = !setupComplete;
        const shouldShowOnboarding = searchParams.get("onboarding") === "1";

        if (setupIncomplete && shouldShowOnboarding) {
          router.replace('/admin/getting-started?onboarding=1');
          setLoading(false);
          return;
        }

        setDetectedCountryName(dashboardCountryName);
        setDetectedCurrency(dashboardCurrency);
        setSchoolName(schoolNameToUse);
        setLoading(false);
        } catch (timeoutErr: unknown) {
          const error = timeoutErr as any;
          if (error?.name === 'AbortError') {
            console.error('[Dashboard] Request timeout - backend may be unreachable');
            setError('Backend service is unavailable. Please refresh the page.');
            setLoading(false);
          } else {
            throw timeoutErr;
          }
        }
      } catch (err) {
        console.error('[Dashboard] Error loading dashboard:', err);
        console.error('[Dashboard] Error details:', {
          message: err instanceof Error ? err.message : String(err),
          type: err instanceof Error ? err.constructor.name : typeof err,
        });
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (errorMsg.includes('Failed to fetch')) {
          setError('Cannot reach the backend server. Is it running?');
        } else {
          setError('Failed to load dashboard. Please try refreshing the page.');
        }
        setLoading(false);
      }
    }

    loadData();
  }, [refreshNonce]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-2">Cannot Load Dashboard</h2>
          <p className="text-muted mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              window.location.reload();
            }}
            className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-brand/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (subscriptionBlocked) {
    return <SubscriptionModal reason={subscriptionBlocked.reason} schoolName={subscriptionBlocked.schoolName || schoolName || 'Your School'} />;
  }

  const stats = [
    {
      label: "Outstanding fees",
      value: formatMoney(dashboardData?.outstanding || 0, dashboardData?.currency || "NGN"),
      sub: `${dashboardData?.attentionCount || 0} invoices need attention`,
      href: "/admin/fees",
      icon: CreditCard,
    },
    {
      label: "Active pupils",
      value: String(dashboardData?.pupilCount || 0),
      sub: `${dashboardData?.classCount || 0} classes`,
      href: "/admin/students",
      icon: Users,
    },
    {
      label: "Classes",
      value: String(dashboardData?.classCount || 0),
      sub: "Manage grade groups and sections",
      href: "/admin/classes",
      icon: Layers,
    },
    {
      label: "Recent payments",
      value: String(dashboardData?.recentPayments?.length || 0),
      sub: "Latest transactions",
      href: "/admin/fees",
      icon: TrendingUp,
    },
  ];

  return (
    <>
      <style>{whatsAppWiggleStyle}</style>
      <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <LayoutDashboard size={17} /> School overview
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Good morning, {schoolName || 'Dashboard'}
          </h1>
          <p className="mt-1 text-muted">
            Live dashboard — fees, results, and pupils from your database.
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {whatsAppConnected !== null && (
            <button
              title={whatsAppConnected ? 'WhatsApp connected — Ready to send school messages' : 'WhatsApp disconnected — Reconnect via settings'}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-sm whatsapp-pulse ${whatsAppConnected ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:shadow-md' : 'bg-amber-100 text-amber-600 hover:bg-amber-200 hover:shadow-md'}`}
            >
              <WhatsAppIcon className="h-5 w-5" />
            </button>
          )}
          <Link href="/admin/getting-started" className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover">
            Start guide
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="group block">
              <div className="border border-border bg-surface p-5 transition-colors hover:bg-brand-light/40">
                <div className="mb-4 flex items-center gap-2 text-brand">
                  <IconComponent className="h-4 w-4 text-brand" />
                  <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">
                    {stat.label}
                  </span>
                </div>
                <div className="text-3xl font-semibold text-foreground">{stat.value}</div>
                <div className="mt-1 text-xs text-muted">{stat.sub}</div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <CheckCircle2 className="h-4 w-4" />
            Quick actions
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/fees" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">
            <CreditCard className="h-4 w-4" />
            Fees
          </Link>
          <Link href="/admin/students" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">
            <Users className="h-4 w-4" />
            Students
          </Link>
          <Link href="/admin/teachers" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">
            <BookOpen className="h-4 w-4" />
            Teachers
          </Link>
          <Link href="/admin/website" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">
            <MessageSquare className="h-4 w-4" />
            Announcements
          </Link>
        </div>
      </div>

      {/* Grid of sections - Responsive: 1 col mobile, 2 col tablet, 2 col desktop */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Payments */}
        <div className={`rounded-lg border p-6 shadow-sm transition-shadow flex flex-col ${dashboardSectionThemes[1].shell}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${dashboardSectionThemes[1].iconWrap}`}>
                <DollarSign className={`h-5 w-5 ${dashboardSectionThemes[1].iconColor}`} />
              </div>
              <h2 className="font-semibold text-foreground">Recent payments</h2>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium ${dashboardSectionThemes[1].badge}`}>
              Latest
            </span>
          </div>
          <ul className="mt-4 divide-y divide-border/70 flex-1">
            {!dashboardData?.recentPayments || dashboardData.recentPayments.length === 0 ? (
              <li className="py-3 text-sm text-muted">No payments yet.</li>
            ) : (
              dashboardData.recentPayments.slice(0, 3).map((p: any, idx: number) => (
                <li key={idx} className={`flex items-center justify-between gap-2 px-3 py-2.5 first:pt-2.5 last:pb-2.5 ${dashboardSectionThemes[1].row}`}>
                  <span className="font-medium text-foreground text-sm truncate">{p.invoice?.pupil?.firstName} {p.invoice?.pupil?.lastName}</span>
                  <span className="text-xs text-muted flex-shrink-0">{new Date(p.paidAt || Date.now()).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</span>
                  <span className="text-sm font-bold text-green-600 flex-shrink-0 text-right min-w-fit">{formatMoney(p.amount, dashboardData?.currency || "NGN")}</span>
                </li>
              ))
            )}
          </ul>
          <Link href="/admin/fees" className={`mt-4 flex justify-end items-center gap-1 text-sm font-semibold transition ${dashboardSectionThemes[1].link}`}>
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Latest Students */}
        <div className={`rounded-lg border p-6 shadow-sm transition-shadow flex flex-col ${dashboardSectionThemes[2].shell}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${dashboardSectionThemes[2].iconWrap}`}>
                <Users className={`h-5 w-5 ${dashboardSectionThemes[2].iconColor}`} />
              </div>
              <h2 className="font-semibold text-foreground">Latest students</h2>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium ${dashboardSectionThemes[2].badge}`}>
              New
            </span>
          </div>
          <ul className="mt-4 divide-y divide-border/70 flex-1">
            {!dashboardData?.recentPupils || dashboardData.recentPupils.length === 0 ? (
              <li className="py-3 text-sm text-muted">No new students yet.</li>
            ) : (
              dashboardData.recentPupils.slice(0, 3).map((pupil: any, idx: number) => (
                <li key={idx} className={`flex items-center justify-between gap-2 px-3 py-2.5 first:pt-2.5 last:pb-2.5 ${dashboardSectionThemes[2].row}`}>
                  <span className="font-medium text-foreground text-sm truncate">{pupil.firstName} {pupil.lastName}</span>
                  <span className="text-xs text-muted flex-shrink-0">{pupil.class?.name || "Unassigned"} {pupil.class?.arm ? `(${pupil.class.arm})` : ""}</span>
                  <span className="text-xs text-muted flex-shrink-0">
                    {new Date(pupil.createdAt || Date.now()).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </li>
              ))
            )}
          </ul>
          <Link href="/admin/students" className={`mt-4 flex justify-end items-center gap-1 text-sm font-semibold transition ${dashboardSectionThemes[2].link}`}>
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Latest Teachers */}
        <div className={`rounded-lg border p-6 shadow-sm transition-shadow flex flex-col ${dashboardSectionThemes[0].shell}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${dashboardSectionThemes[0].iconWrap}`}>
                <BookOpen className={`h-5 w-5 ${dashboardSectionThemes[0].iconColor}`} />
              </div>
              <h2 className="font-semibold text-foreground">Latest teachers</h2>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium ${dashboardSectionThemes[0].badge}`}>
              New
            </span>
          </div>
          <ul className="mt-4 divide-y divide-border/70 flex-1">
            {!dashboardData?.recentTeachers || dashboardData.recentTeachers.length === 0 ? (
              <li className="py-3 text-sm text-muted">No recent teachers yet.</li>
            ) : (
              dashboardData.recentTeachers.slice(0, 3).map((teacher: any, idx: number) => (
                <li key={idx} className={`flex items-center justify-between gap-2 px-3 py-2.5 first:pt-2.5 last:pb-2.5 ${dashboardSectionThemes[0].row}`}>
                  <span className="font-medium text-foreground text-sm truncate">{teacher.name || "Unknown"}</span>
                  <span className="text-xs text-muted truncate flex-shrink-0">{teacher.email || "No email"}</span>
                </li>
              ))
            )}
          </ul>
          <Link href="/admin/teachers" className={`mt-4 flex justify-end items-center gap-1 text-sm font-semibold transition ${dashboardSectionThemes[0].link}`}>
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Latest Announcements */}
        <div className={`rounded-lg border p-6 shadow-sm transition-shadow flex flex-col ${dashboardSectionThemes[3].shell}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${dashboardSectionThemes[3].iconWrap}`}>
                <MessageSquare className={`h-5 w-5 ${dashboardSectionThemes[3].iconColor}`} />
              </div>
              <h2 className="font-semibold text-foreground">Latest announcements</h2>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium ${dashboardSectionThemes[3].badge}`}>
              New
            </span>
          </div>
          <ul className="mt-4 divide-y divide-border/70 flex-1">
            {!dashboardData?.recentAnnouncements || dashboardData.recentAnnouncements.length === 0 ? (
              <li className="py-3 text-sm text-muted">No announcements yet.</li>
            ) : (
              dashboardData.recentAnnouncements.slice(0, 3).map((announcement: any, idx: number) => (
                <li key={idx} className={`flex items-center justify-between gap-2 px-3 py-2.5 first:pt-2.5 last:pb-2.5 ${dashboardSectionThemes[3].row}`}>
                  <span className="font-medium text-foreground text-sm truncate flex-1">{announcement.title || "Untitled"}</span>
                  <span className="text-xs text-muted flex-shrink-0">
                    {new Date(announcement.publishedAt || announcement.createdAt || Date.now()).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </li>
              ))
            )}
          </ul>
          <Link href="/admin/website" className={`mt-4 flex justify-end items-center gap-1 text-sm font-semibold transition ${dashboardSectionThemes[3].link}`}>
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </section>
      </div>
    </>
  );
}
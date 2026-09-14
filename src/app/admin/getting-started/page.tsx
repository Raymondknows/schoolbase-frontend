"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Compass,
  DollarSign,
  GraduationCap,
  Layers,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";

type Step = {
  title: string;
  description: string;
  href: string;
  complete: boolean;
  icon: typeof Settings;
  hint: string;
};

type SchoolConfig = {
  name?: string | null;
  country?: string | null;
  currency?: string | null;
  principalSignatureUrl?: string | null;
  stampUrl?: string | null;
};

type Counts = {
  classCount: number;
  subjectCount: number;
  academicTermCount: number;
  teacherCount: number;
  studentCount: number;
  feeCount: number;
  feeScheduleCount: number;
  announcementCount: number;
  assessmentCount: number;
};

type StudentRecord = {
  isActive?: boolean | null;
};

type StudentsResponse = {
  pupils?: StudentRecord[] | null;
};

function buildSteps(
  schoolConfig: SchoolConfig | null,
  counts: Counts
): Step[] {
  return [
    {
      title: "Set your school profile",
      description: "Complete the school identity, location, currency, branding, signature and stamp details so every staff member starts from a polished workspace.",
      href: "/admin/settings",
      complete: Boolean(
        schoolConfig?.name &&
        schoolConfig?.country &&
        schoolConfig?.currency &&
        (schoolConfig?.principalSignatureUrl || schoolConfig?.stampUrl)
      ),
      icon: Settings,
      hint: "Start here",
    },
    {
      title: "Create classes and subjects",
      description: "Lay the academic structure in place so reports, promotions and attendance stay organized from day one.",
      href: "/admin/classes",
      complete: counts.classCount > 0 && counts.subjectCount > 0,
      icon: Layers,
      hint: "Foundation",
    },
    {
      title: "Set academic years and terms",
      description: "Define the current academic year and terms so results, fees and promotions align to the right school cycle.",
      href: "/admin/settings",
      complete: counts.academicTermCount > 0,
      icon: BookOpen,
      hint: "Academic setup",
    },
    {
      title: "Add staff",
      description: "Bring your teaching and finance team into the system and assign the right roles so staff can work at full strength.",
      href: "/admin/staff",
      complete: counts.teacherCount > 0,
      icon: Users,
      hint: "Team setup",
    },
    {
      title: "Register students",
      description: "Import or add your learners so fees, attendance, parent access and results all connect in one place.",
      href: "/admin/students",
      complete: counts.studentCount > 0,
      icon: GraduationCap,
      hint: "Student records",
    },
    {
      title: "Set up fees and billing",
      description: "Create fee structures and collections so your school can invoice parents and track payments with confidence.",
      href: "/admin/fees",
      complete: counts.feeScheduleCount > 0 || counts.feeCount > 0,
      icon: DollarSign,
      hint: "Cash flow",
    },
    {
      title: "Send your first announcement",
      description: "Publish a welcome or update message so parents and staff feel informed as soon as the school is live.",
      href: "/admin/website",
      complete: counts.announcementCount > 0,
      icon: Sparkles,
      hint: "Communication",
    },
    {
      title: "Publish your first assessment",
      description: "Create a first assessment so the school can start publishing results and giving parents a useful experience quickly.",
      href: "/admin/results",
      complete: counts.assessmentCount > 0,
      icon: ShieldCheck,
      hint: "Go-live",
    },
  ];
}

export default function GettingStartedPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState("your school");
  const [steps, setSteps] = useState<Step[]>([]);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [setupStatus, setSetupStatus] = useState<{ isComplete?: boolean } | null>(null);
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
    let mounted = true;

    async function loadData() {
      try {
        const backendUrl = getBackendUrl();
        const [settingsRes, classesRes, teachersRes, studentsRes, feesRes, subjectsRes, termsRes, announcementsRes, resultsRes, verifyRes] = await Promise.all([
          fetch(`${backendUrl}/api/admin/settings/data`, { credentials: "include" }).catch(() => null),
          fetch(`${backendUrl}/api/admin/classes/data`, { credentials: "include" }).catch(() => null),
          fetch(`${backendUrl}/api/admin/teachers/data`, { credentials: "include" }).catch(() => null),
          fetch(`${backendUrl}/api/admin/students/data`, { credentials: "include" }).catch(() => null),
          fetch(`${backendUrl}/api/admin/fees/data`, { credentials: "include" }).catch(() => null),
          fetch(`${backendUrl}/api/admin/subjects/data`, { credentials: "include" }).catch(() => null),
          fetch(`${backendUrl}/api/admin/terms`, { credentials: "include" }).catch(() => null),
          fetch(`${backendUrl}/api/admin/announcements`, { credentials: "include" }).catch(() => null),
          fetch(`${backendUrl}/api/admin/results/data`, { credentials: "include" }).catch(() => null),
          fetch(`${backendUrl}/api/admin/verify`, { credentials: "include" }).catch(() => null),
        ]);

        const settingsData = settingsRes?.ok ? await settingsRes.json().catch(() => null) : null;
        const classesData = classesRes?.ok ? await classesRes.json().catch(() => null) : null;
        const teachersData = teachersRes?.ok ? await teachersRes.json().catch(() => null) : null;
        const studentsData = studentsRes?.ok ? await studentsRes.json().catch(() => null) : null;
        const feesData = feesRes?.ok ? await feesRes.json().catch(() => null) : null;
        const subjectsData = subjectsRes?.ok ? await subjectsRes.json().catch(() => null) : null;
        const termsData = termsRes?.ok ? await termsRes.json().catch(() => null) : null;
        const announcementsData = announcementsRes?.ok ? await announcementsRes.json().catch(() => null) : null;
        const resultsData = resultsRes?.ok ? await resultsRes.json().catch(() => null) : null;

        const schoolConfig = settingsData?.config;
        const counts = {
          classCount: classesData?.classes?.length || 0,
          subjectCount: subjectsData?.subjects?.length || 0,
          academicTermCount: termsData?.terms?.length || 0,
          teacherCount: teachersData?.teachers?.length || 0,
          studentCount: (studentsData as StudentsResponse | null)?.pupils?.filter((p: StudentRecord) => p.isActive !== false).length || 0,
          feeCount: feesData?.invoices?.length || 0,
          feeScheduleCount: feesData?.feeSchedules?.length || 0,
          announcementCount: announcementsData?.announcements?.length || 0,
          assessmentCount: resultsData?.assessments?.length || 0,
        };
        const verifyData = verifyRes?.ok ? await verifyRes.json().catch(() => null) : null;
        const schoolId = verifyData?.session?.schoolId;
        let setupStatus: { isComplete?: boolean } | null = null;

        if (schoolId) {
          try {
            const statusRes = await fetch(`/api/admin/school/${schoolId}/setup-status`, { credentials: "include" });
            if (statusRes.ok) {
              setupStatus = await statusRes.json().catch(() => null);
            }
          } catch (error) {
            console.error("Error loading school setup status", error);
          }
        }

        if (!mounted) return;

        setSchoolName(schoolConfig?.name || "your school");
        setSteps(buildSteps(schoolConfig, counts));
        setSetupStatus(setupStatus);
      } catch (error) {
        console.error("Error loading getting started data", error);
        if (mounted) {
          setSteps(
            buildSteps(null, {
              classCount: 0,
              subjectCount: 0,
              academicTermCount: 0,
              teacherCount: 0,
              studentCount: 0,
              feeCount: 0,
              feeScheduleCount: 0,
              announcementCount: 0,
              assessmentCount: 0,
            })
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [refreshNonce, searchParams]);

  const completedCount = useMemo(() => steps.filter((step) => step.complete).length, [steps]);
  const progressPercent = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;
  const remainingCount = Math.max(steps.length - completedCount, 0);
  const nextStep = useMemo(() => steps.find((step) => !step.complete) || steps[0], [steps]);
  const isOnboarding = searchParams.get("onboarding") === "1";
  const isSetupComplete = setupStatus?.isComplete === true || (steps.length > 0 && completedCount === steps.length);
  const showFullExperience = !isSetupComplete;

  if (!loading && !showFullExperience) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] border border-brand/20 bg-gradient-to-br from-brand/15 via-background to-brand/5 p-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/20 bg-background/80 px-3 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                <Sparkles className="h-4 w-4" />
                Setup complete
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{schoolName} is ready for day-to-day operations</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted">
                  The core setup is done, so the assistant stays quiet and lets your team work normally. You can still review the checklist anytime or open a small task prompt when you want a next step.
                </p>
              </div>
            </div>
            <div className="text-sm text-muted">
              <div className="text-3xl font-semibold text-foreground">{completedCount}/{steps.length}</div>
              <div>tasks complete</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">What’s next?</h2>
            <p className="mt-2 text-sm text-muted">Your school is fully set up for the basics. You can continue managing students, fees, results and communications from the main admin pages.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/admin" className="rounded-full bg-brand px-3 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand/90">
                Go to dashboard
              </Link>
              <button
                type="button"
                onClick={() => setShowTasksModal(true)}
                className="rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-all duration-300 hover:border-brand/30 hover:bg-brand/5"
              >
                Open next tasks
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Helpful shortcuts</h2>
            <div className="mt-4 space-y-3">
              <Link href="/admin/settings" className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-brand/5">
                <span>Review school settings</span>
                <ArrowRight className="h-4 w-4 text-muted" />
              </Link>
              <Link href="/admin/teachers" className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-brand/5">
                <span>Manage staff</span>
                <ArrowRight className="h-4 w-4 text-muted" />
              </Link>
            </div>
          </div>
        </div>

        {showTasksModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Next tasks</h2>
                  <p className="mt-1 text-sm text-muted">Choose a follow-up action without reopening the full setup flow.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTasksModal(false)}
                  className="rounded-full border border-border bg-background p-2 text-muted transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <Link href="/admin/results" onClick={() => setShowTasksModal(false)} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-brand/5">
                  <span>
                    <span className="block">Publish results</span>
                    <span className="mt-0.5 block text-xs font-normal text-muted">Create your first assessment and share it with the school community.</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted" />
                </Link>
                <Link href="/admin/website" onClick={() => setShowTasksModal(false)} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-brand/5">
                  <span>
                    <span className="block">Send announcements</span>
                    <span className="mt-0.5 block text-xs font-normal text-muted">Inform staff, parents and students about the latest school updates.</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-border/80 bg-surface shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)]">
        <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-border/70 bg-gradient-to-br from-brand/20 via-background to-brand/5 p-6 sm:p-8 xl:border-b-0 xl:border-r">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">
                    <Sparkles className="h-3.5 w-3.5" />
                    Setup your workspace
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">Get {schoolName} ready to run smoothly</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                      {isOnboarding
                        ? "This guided workspace setup helps your team complete the essentials quickly and move into daily use with confidence."
                        : "Use this guided checklist to make sure nothing important is missed as your school grows with SchoolBase."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={nextStep?.href || "/admin/settings"}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand/90"
                    >
                      <Zap className="h-4 w-4" />
                      Continue
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 hover:border-brand/30 hover:bg-brand/5"
                    >
                      Open settings
                    </Link>
                  </div>
                </div>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-brand/20 bg-brand/10 shadow-sm">
                  <Sparkles className="h-8 w-8 text-brand" />
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-brand/20 bg-gradient-to-br from-brand/10 via-background to-brand/5 p-5 shadow-inner">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Workspace progress</span>
                  <span className="font-semibold text-brand">{progressPercent}%</span>
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-muted">
                  <span>{completedCount} completed</span>
                  <span>{remainingCount} remaining</span>
                </div>
              </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="rounded-[24px] border border-border bg-background p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand">
                <Compass className="h-4 w-4" />
                Next step
              </div>
              <h2 className="mt-3 text-lg font-semibold text-foreground">{nextStep?.title || "School setup"}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{nextStep?.description || "Get everything ready for your first active school month."}</p>
              <Link
                href={nextStep?.href || "/admin/settings"}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand/10 px-3.5 py-2 text-sm font-semibold text-brand transition-all duration-300 hover:bg-brand/20"
              >
                Open now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { title: "School settings", href: "/admin/settings", description: "Complete your profile" },
                { title: "Classes & subjects", href: "/admin/classes", description: "Build the structure" },
                { title: "Results & assessments", href: "/admin/results", description: "Start publishing" },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-[20px] border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-brand/5"
                >
                  <span className="block">{item.title}</span>
                  <span className="mt-1 block text-xs font-normal text-muted">{item.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-border/80 bg-surface p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Setup checklist</h2>
            <p className="text-sm text-muted">Each step is arranged to move the school from configuration to everyday use.</p>
          </div>
          <div className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-muted">
            {completedCount}/{steps.length}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-background" />
            ))}
          </div>
        ) : (
          <div>
            {steps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background/70 p-4 text-sm text-muted">
                Everything is in place. You can keep working from the main admin pages.
              </div>
            ) : (
              <ol className="space-y-2">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isNext = step.title === nextStep?.title;

                  return (
                    <li key={step.title}>
                      <Link
                        href={step.href}
                        className={`group flex flex-col gap-3 rounded-[18px] border px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-sm sm:flex-row sm:items-center ${
                          step.complete
                            ? "border-border/70 bg-background/70"
                            : isNext
                              ? "border-brand/30 bg-brand/5"
                              : "border-border bg-background"
                        }`}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${step.complete ? "bg-emerald-500/10 text-emerald-600" : isNext ? "bg-brand text-white" : "bg-brand/10 text-brand"}`}>
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                            <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                              {step.hint}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-muted">{step.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${step.complete ? "bg-emerald-50 text-emerald-700" : "bg-background text-muted"}`}>
                            {step.complete ? "Done" : isNext ? "Next" : "Open"}
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

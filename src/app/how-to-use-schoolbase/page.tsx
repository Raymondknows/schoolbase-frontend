import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Globe,
  Megaphone,
  PlayCircle,
  School,
  TrendingUp,
  Users,
  WalletCards,
  Workflow,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How to Use SchoolBase | School Setup and Workflows",
  description:
    "A practical starting path for setting up SchoolBase, preparing staff and records, running school workflows, and connecting parents to the information they need.",
  alternates: { canonical: "https://schoolbase.live/how-to-use-schoolbase" },
  openGraph: {
    title: "How to Use SchoolBase | Get Started with Your School",
    description:
      "Follow a clear setup-to-daily-use path for administrators, teachers, bursars, and parents.",
    url: "https://schoolbase.live/how-to-use-schoolbase",
    type: "website",
  },
};

const journey = [
  {
    number: "01",
    title: "Prepare your school workspace",
    description:
      "Start with the information and structure every other workflow depends on: your school profile, academic periods, phases, classes, and subjects.",
    tasks: [
      "Confirm the school name, contact details, location, and currency.",
      "Set the academic year, terms, phases, classes, and subjects.",
      "Add school branding and leadership details for official documents.",
    ],
    href: "/docs/admin",
    link: "School administration guide",
    icon: School,
  },
  {
    number: "02",
    title: "Bring in people and records",
    description:
      "Add staff, students, and guardians, then give each team member the access and responsibilities they need for their part of school life.",
    tasks: [
      "Create staff accounts and assign classes or subjects.",
      "Import or register student records and link guardians.",
      "Review admissions and convert approved applications into school records.",
    ],
    href: "/docs/admissions",
    link: "Admissions and student records",
    icon: Users,
  },
  {
    number: "03",
    title: "Set up the workflows you will use first",
    description:
      "Choose a manageable starting point. Many schools begin with fees, attendance, or results, then expand once staff are comfortable with the process.",
    tasks: [
      "Create itemized fee schedules, invoices, and payment instructions.",
      "Configure assessments and agree how results are reviewed and published.",
      "Practice attendance, announcements, and the communication steps your school needs.",
    ],
    href: "/docs/fees",
    link: "Fees and payment guide",
    icon: Workflow,
  },
  {
    number: "04",
    title: "Run the school cycle and keep improving",
    description:
      "Use the connected records through the term: teachers record activity, administrators review it, bursars track finance, and parents access information shared with them.",
    tasks: [
      "Record attendance and assessment activity in assigned classes.",
      "Review and publish results before making them available to families.",
      "Check reports, balances, and feedback regularly; improve one workflow at a time.",
    ],
    href: "/docs/academics",
    link: "Academics and results guide",
    icon: GraduationCap,
  },
];

const roles = [
  { title: "School administrators", text: "Set up the school, manage records, review activity, and control approvals.", href: "/docs/admin" },
  { title: "Teachers", text: "Work with assigned classes and subjects, attendance, assessments, and results.", href: "/docs/teachers" },
  { title: "Bursars and finance teams", text: "Manage invoices and payments, and review wider accounting activity.", href: "/docs/accounting" },
  { title: "Parents", text: "Access the information for linked children, including published results, attendance, and invoices.", href: "/docs/parents" },
  { title: "Admissions and office teams", text: "Review applications, maintain student records, and keep school information current.", href: "/docs/admissions" },
];

const otherWorkflows = [
  {
    title: "Timetables",
    area: "Planning and teaching",
    description: "Build and publish the school timetable, then let teachers and parents view the schedules available to them.",
    icon: CalendarDays,
    links: [
      { label: "Plan timetable", href: "/admin/timetable" },
      { label: "Teacher view", href: "/teacher/timetable" },
      { label: "Parent view", href: "/parent/timetable" },
    ],
  },
  {
    title: "Student ID cards",
    area: "Student records",
    description: "Select active students, review a card proof, then generate print-ready CR80 cards or A4 sheets.",
    icon: WalletCards,
    links: [{ label: "Open ID Card Studio", href: "/admin/id-cards" }],
  },
  {
    title: "School website and announcements",
    area: "School communication",
    description: "Prepare school updates and manage which announcements are published on the public school website.",
    icon: Globe,
    links: [{ label: "Manage announcements", href: "/admin/website" }, { label: "Communication guide", href: "/docs/communication" }],
  },
  {
    title: "Admissions",
    area: "Enrolment",
    description: "Review school applications, follow their status, and continue approved applicants into school records.",
    icon: Building2,
    links: [{ label: "Review applications", href: "/admin/admissions" }, { label: "Student records", href: "/admin/students" }, { label: "Admissions guide", href: "/docs/admissions" }],
  },
  {
    title: "Promotions",
    area: "Academic year transition",
    description: "Preview student promotion decisions, apply the school’s approved changes, and refer to promotion history.",
    icon: TrendingUp,
    links: [{ label: "Open promotions", href: "/admin/promotions" }],
  },
  {
    title: "Accounting and bursary",
    area: "Finance operations",
    description: "Record and review school income, expenses, cashbook activity, and financial reports alongside fee workflows.",
    icon: WalletCards,
    links: [{ label: "Open accounting", href: "/accounting" }, { label: "Accounting guide", href: "/docs/accounting" }],
  },
  {
    title: "Reports and analytics",
    area: "Review and planning",
    description: "Use class, subject, attendance, academic, and accounting views to identify what needs attention.",
    icon: BarChart3,
    links: [{ label: "Reports guide", href: "/docs/reports" }, { label: "Admin analytics", href: "/admin/analytics" }],
  },
  {
    title: "Attendance and communication",
    area: "Everyday operations",
    description: "Record attendance and keep staff and families updated through school announcements and available communication channels.",
    icon: Megaphone,
    links: [{ label: "Record attendance", href: "/admin/attendance" }, { label: "Communication guide", href: "/docs/communication" }],
  },
];

export default function HowToUseSchoolBasePage() {
  return (
    <main className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-16 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-24">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">SchoolBase onboarding</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              How to use SchoolBase, one connected workflow at a time.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Set up the school foundation, bring your team and records together, then build the daily workflows your school is ready to use.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">
                Start a school workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/platform" className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand">
                Explore the platform <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <Link href="/admin/getting-started" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
              Already have a school account? Open the setup checklist <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative min-h-[360px] lg:min-h-[430px]">
            <div className="absolute inset-4 border border-brand/20 bg-white shadow-[18px_18px_0_0_#dcecff] sm:inset-8" />
            <div className="relative flex min-h-[360px] flex-col justify-between border border-brand/30 bg-white p-6 shadow-xl sm:min-h-[430px] sm:p-9">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">A practical starting path</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">From setup to school day</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><BookOpen className="h-5 w-5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                {journey.map((step) => (
                  <div key={step.number} className="border border-black/5 bg-[#eaf4ff] p-4">
                    <p className="text-xs font-semibold text-brand">{step.number}</p>
                    <p className="mt-3 text-sm font-semibold leading-5 text-foreground">{step.title}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-5 text-sm text-muted">
                <span className="font-semibold text-brand">Start with what matters now.</span> You can add connected workflows as your team is ready.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The core idea</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">One school. One system. Work that carries forward.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              A student record supports classes, fees, attendance, results, and parent access. The value comes from setting up each step carefully and letting the right team use the information they need.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Set up the school", "Prepare people and records", "Run daily workflows", "Review and improve"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 border border-border bg-background px-4 py-4 text-sm font-semibold text-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs text-white">{String(index + 1).padStart(2, "0")}</span>{item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="journey" className="scroll-mt-8 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The how-to path</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Build from a solid foundation.</h2>
            </div>
            <p className="max-w-md text-base leading-7 text-muted">Use the steps in order for a new setup, or jump directly to the area you need to work on.</p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {journey.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.number} className="border border-border bg-white p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
                    <div>
                      <p className="text-sm font-bold text-brand">STEP {step.number}</p>
                      <h3 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">{step.title}</h3>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-brand-light text-brand"><Icon className="h-5 w-5" /></div>
                  </div>
                  <p className="mt-5 leading-7 text-muted">{step.description}</p>
                  <ul className="mt-5 space-y-3">
                    {step.tasks.map((task) => <li key={task} className="flex items-start gap-3 text-sm leading-6 text-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><span>{task}</span></li>)}
                  </ul>
                  <Link href={step.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover">{step.link} <ArrowRight className="h-4 w-4" /></Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">More school workflows</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Use the tools that fit your school.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">Not every school needs every module on day one. Open a workflow when it matches the job your team is ready to do.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherWorkflows.map(({ title, area, description, icon: Icon, links }) => (
              <article key={title} className="border border-border bg-background p-6 transition hover:border-brand/40">
                <div className="flex h-11 w-11 items-center justify-center bg-brand-light text-brand"><Icon className="h-5 w-5" /></div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand">{area}</p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4">
                  {links.map((link) => <Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover">{link.label}<ArrowRight className="h-3.5 w-3.5" /></Link>)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-[#f6faff] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">For the people in your school</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Find the guide for your role.</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <Link key={role.title} href={role.href} className="group border border-border bg-white p-6 transition hover:border-brand/50">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-brand">{role.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{role.text}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand">Open guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-3">
          <Link href="/video-tutorials" className="group border border-border bg-white p-6 transition hover:border-brand/50">
            <PlayCircle className="h-5 w-5 text-brand" />
            <h2 className="mt-4 text-lg font-semibold text-foreground group-hover:text-brand">Watch video tutorials</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Browse available demonstrations and task-focused videos.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">Open video library <ArrowRight className="h-4 w-4" /></span>
          </Link>
          <Link href="/guides" className="group border border-border bg-white p-6 transition hover:border-brand/50">
            <BookOpen className="h-5 w-5 text-brand" />
            <h2 className="mt-4 text-lg font-semibold text-foreground group-hover:text-brand">Explore practical guides</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Go deeper on fees, reporting, digital change, and school workflows.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">Browse guides <ArrowRight className="h-4 w-4" /></span>
          </Link>
          <Link href="/staff-training" className="group border border-border bg-white p-6 transition hover:border-brand/50">
            <Users className="h-5 w-5 text-brand" />
            <h2 className="mt-4 text-lg font-semibold text-foreground group-hover:text-brand">Arrange team training</h2>
            <p className="mt-2 text-sm leading-6 text-muted">See the optional school-wide training available for your team.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">Training options <ArrowRight className="h-4 w-4" /></span>
          </Link>
        </div>
      </section>

      <section className="bg-brand py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Ready to put the steps into practice?</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Give your school a clear place to begin.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/80">Set up your workspace, then use the checklist to guide your first school workflows.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand transition hover:bg-blue-50">Get started <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/faq" className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Read common questions <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Globe2,
  School,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "School Management by Industry | SchoolBase",
  description:
    "Explore SchoolBase workflows for primary, secondary, international, and private schools.",
};

const industries = [
  {
    title: "Primary schools",
    description:
      "Clear, parent-focused workflows for young learners, attendance, fees, and progress.",
    href: "/industries/primary-schools",
    icon: School,
    features: [
      "Simple academic records",
      "Daily attendance visibility",
      "Parent-focused updates",
      "Clear fee workflows",
    ],
  },
  {
    title: "Secondary schools",
    description:
      "Structured academic and operational workflows for subject-rich secondary school environments.",
    href: "/industries/secondary-schools",
    icon: BookOpen,
    features: [
      "Subject and class records",
      "Assessment and results workflows",
      "Performance visibility",
      "Teacher coordination",
    ],
  },
  {
    title: "International schools",
    description:
      "A connected foundation for schools coordinating diverse curricula, families, and reporting needs.",
    href: "/industries/international-schools",
    icon: Globe2,
    features: [
      "Flexible academic structures",
      "Clearer fee records",
      "Parent communication",
      "Operational reporting",
    ],
  },
  {
    title: "Private schools",
    description:
      "Connected administration, finance, academics, and parent workflows for independent school teams.",
    href: "/school-management-software-for-private-schools",
    icon: Users,
    features: [
      "School-wide visibility",
      "Fee and payment tracking",
      "Results and reporting",
      "Parent engagement",
    ],
  },
];

const foundations = [
  [
    "Fee management",
    "Track schedules, invoices, payments, receipts, and follow-up.",
  ],
  [
    "Parent communication",
    "Keep families closer to results, fees, attendance, and announcements.",
  ],
  [
    "Academic records",
    "Connect classes, assessments, grading, results, and reports.",
  ],
  [
    "Attendance",
    "Keep daily attendance records visible to the teams who need them.",
  ],
  [
    "Administration",
    "Give school leaders a consistent place to manage core records.",
  ],
  [
    "Reporting",
    "Turn connected school records into clearer operational insight.",
  ],
];

export default function IndustriesPage() {
  return (
    <main className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              SchoolBase for every school type
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              A connected platform that adapts to your school context.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Primary, secondary, international, and private schools all have
              different rhythms. SchoolBase connects the core work while leaving
              room for those differences.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/platform"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground hover:border-brand hover:text-brand"
              >
                Explore the platform
              </Link>
            </div>
          </div>
          <div className="relative min-h-[360px] lg:min-h-[430px]">
            <div className="absolute inset-4 border border-brand/20 bg-white shadow-[18px_18px_0_0_#dcecff] sm:inset-8" />
            <div className="relative flex min-h-[360px] flex-col justify-between border border-brand/30 bg-white p-6 shadow-xl sm:min-h-[430px] sm:p-9">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    School contexts
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    One system, different operating needs
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white">
                  <School className="h-5 w-5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  "Primary",
                  "Secondary",
                  "International",
                  "Private",
                  "Parents",
                  "Teachers",
                ].map((item, index) => (
                  <div
                    key={item}
                    className={`${["bg-[#eaf4ff]", "bg-[#f1f7f4]", "bg-[#fff7e8]", "bg-[#f2efff]", "bg-[#edf7f8]", "bg-[#fff0f0]"][index]} border border-black/5 p-4`}
                  >
                    <p className="text-xs text-muted">SchoolBase</p>
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {item} schools
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-5 text-sm text-muted">
                <span className="font-semibold text-brand">
                  Fit for context.
                </span>{" "}
                Core records and workflows stay connected across the school.
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Choose your context
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Start with the type of school you run.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {industries.map(
              ({ title, description, href, icon: Icon, features }) => (
                <Link
                  key={href}
                  href={href}
                  className="group border border-border bg-white p-6 transition hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center bg-brand-light text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted group-hover:translate-x-1 group-hover:text-brand" />
                  </div>
                  <h2 className="mt-7 text-xl font-semibold text-foreground group-hover:text-brand">
                    {title}
                  </h2>
                  <p className="mt-3 leading-7 text-muted">{description}</p>
                  <ul className="mt-6 space-y-3">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm leading-6 text-muted"
                      >
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-brand" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>
      <section className="border-y border-border bg-[#f6faff] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Shared foundations
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Every school needs the same connected basics.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {foundations.map(([title, description]) => (
              <div key={title} className="border border-border bg-white p-6">
                <BarChart3 className="h-5 w-5 text-brand" />
                <h3 className="mt-5 text-xl font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-brand py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Find your context
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Explore the SchoolBase platform for your school type.
            </h2>
          </div>
          <Link
            href="/signup"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50"
          >
            Start Your School <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

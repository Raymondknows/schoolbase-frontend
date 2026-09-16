import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, ChevronRight, CircleDollarSign, ClipboardList, GraduationCap, Megaphone, School, Users } from "lucide-react";
import { platformModules, platformSteps, roleCards } from "./platform-content";

export const metadata: Metadata = {
  title: "SchoolBase Platform | Connected School Management Software",
  description: "SchoolBase connects school administration, academics, fees, accounting, communication, admissions, teachers, parents, and reporting in one school management platform.",
  keywords: ["school management system", "school management software", "school accounting", "school fee management", "school result management", "school admission management", "school ERP", "school software Africa"],
  alternates: { canonical: "https://schoolbase.live/platform" },
  openGraph: {
    title: "SchoolBase Platform | Connected School Management Software",
    description: "One platform for school administration, academics, finance, communication, and parents.",
    url: "https://schoolbase.live/platform",
    type: "website",
  },
};

const moduleIcons = [School, CircleDollarSign, GraduationCap, Users, ClipboardList, BookOpen, CircleDollarSign, Megaphone, BarChart3];

export default function PlatformPage() {
  return (
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">SchoolBase Platform</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Everything your school needs to operate, connected in one place.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              SchoolBase brings administration, academics, accounting, fees, admissions, teachers, parents, communication, and reporting together in one connected school management platform.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#modules" className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand">
                Explore the Platform <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="relative min-h-[360px] lg:min-h-[430px]">
            <div className="absolute inset-4 border border-brand/20 bg-white shadow-[18px_18px_0_0_#dcecff] sm:inset-8" />
            <div className="relative flex min-h-[360px] flex-col justify-between border border-brand/30 bg-white p-6 shadow-xl sm:min-h-[430px] sm:p-9">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">School operations</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">One connected view</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><School className="h-5 w-5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[{ label: "Students", value: "Records", tone: "bg-[#eaf4ff]" }, { label: "Attendance", value: "Tracked", tone: "bg-[#f1f7f4]" }, { label: "Fees", value: "Visible", tone: "bg-[#fff7e8]" }, { label: "Results", value: "Published", tone: "bg-[#f2efff]" }, { label: "Teachers", value: "Assigned", tone: "bg-[#edf7f8]" }, { label: "Updates", value: "Connected", tone: "bg-[#fff0f0]" }].map((item) => (
                  <div key={item.label} className={`${item.tone} border border-black/5 p-4`}>
                    <p className="text-xs text-muted">{item.label}</p><p className="mt-3 text-xl font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-5 text-sm text-muted">
                <span className="font-semibold text-brand">Connected by design.</span> The records one team creates become useful to the next.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The core idea</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">One school. One system. Every operation connected.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">SchoolBase is designed around the way a school actually works. A student record is not isolated from fees, attendance, results, or the parent who needs to see them. Each part strengthens the next.</p>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["School administration", "Students & guardians", "Teachers & classes", "Academics & results", "Attendance", "Fees & payments", "Accounting", "Parents & communication"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 border border-border bg-background px-4 py-4 text-sm font-semibold text-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs text-white">{String(index + 1).padStart(2, "0")}</span>{item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The platform</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Built around the work schools do every day.</h2></div><p className="max-w-md text-base leading-7 text-muted">Explore each area to understand what it does, who uses it, and how it connects to the rest of the school.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {platformModules.map((module, index) => { const Icon = moduleIcons[index]; return <Link key={module.slug} href={`/docs/${module.slug}`} className="group border border-border bg-white p-6 transition hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg"><div className="flex items-start justify-between gap-4"><div className="flex h-11 w-11 items-center justify-center bg-brand-light text-brand"><Icon className="h-5 w-5" /></div><ArrowRight className="h-5 w-5 text-muted transition group-hover:translate-x-1 group-hover:text-brand" /></div><p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-brand">{module.eyebrow}</p><h3 className="mt-2 text-xl font-semibold text-foreground">{module.title}</h3><p className="mt-3 leading-7 text-muted">{module.summary}</p><p className="mt-5 border-t border-border pt-4 text-sm leading-6 text-muted">{module.connects}</p></Link>; })}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-[#f6faff] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">How SchoolBase works</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">A practical flow from setup to insight.</h2></div><div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{platformSteps.map((step) => <div key={step.number} className="border-t-2 border-brand bg-white p-6"><p className="text-sm font-bold text-brand">{step.number}</p><h3 className="mt-7 text-xl font-semibold text-foreground">{step.title}</h3><p className="mt-3 leading-7 text-muted">{step.text}</p></div>)}</div><div className="mt-10 grid gap-4 lg:grid-cols-3"><div className="border border-brand/20 bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Academic flow</p><p className="mt-4 text-lg font-semibold leading-8 text-foreground">Academic year <span className="text-brand">→</span> term <span className="text-brand">→</span> assessments <span className="text-brand">→</span> results <span className="text-brand">→</span> parents</p></div><div className="border border-brand/20 bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Financial flow</p><p className="mt-4 text-lg font-semibold leading-8 text-foreground">Fee schedule <span className="text-brand">→</span> invoice <span className="text-brand">→</span> payment <span className="text-brand">→</span> accounting</p></div><div className="border border-brand/20 bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Communication flow</p><p className="mt-4 text-lg font-semibold leading-8 text-foreground">Admissions, fees, attendance, results <span className="text-brand">→</span> updates</p></div></div></div>
      </section>

      <section className="py-20 sm:py-24"><div className="mx-auto max-w-6xl px-6"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">For the people in your school</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">The right workspace for each role.</h2></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{roleCards.map((role) => <Link key={role.title} href={role.href} className="group border border-border bg-white p-6 hover:border-brand/50"><h3 className="text-lg font-semibold text-foreground group-hover:text-brand">{role.title}</h3><p className="mt-3 text-sm leading-7 text-muted">{role.text}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand">Read the guide <ArrowRight className="h-4 w-4" /></span></Link>)}</div></div></section>

      <section className="bg-brand py-16 text-white sm:py-20"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">A connected operating platform for schools</p><h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Give every part of your school a clearer place to work.</h2></div><Link href="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50">Start Your School <ArrowRight className="h-4 w-4" /></Link></div></section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Mail, MessageCircle, School, Users, Workflow } from "lucide-react";

export const metadata: Metadata = {
  title: "SchoolBase Staff Training | Confident School Teams",
  description: "School-wide SchoolBase training for teachers, bursars, front-office teams, and school leaders.",
  alternates: { canonical: "https://schoolbase.live/staff-training" },
};

const modules = [
  { icon: School, eyebrow: "Orientation", title: "Understand the SchoolBase system", text: "Give every team member a clear view of how school records, roles, workflows, and communication fit together." },
  { icon: Users, eyebrow: "Role-based learning", title: "Train the people who do the work", text: "Focus sessions on teachers, bursars, front-office staff, and school leaders instead of giving everyone the same generic tour." },
  { icon: Workflow, eyebrow: "Practical workflows", title: "Move from demonstration to action", text: "Work through the daily tasks your team needs to complete confidently, from attendance to fees and parent updates." },
  { icon: BookOpen, eyebrow: "Follow-through", title: "Keep adoption moving", text: "Leave the team with clear next steps and seven days of training-related follow-up support." },
];

const outcomes = [
  "Teachers can complete the workflows assigned to them.",
  "Bursars understand the fee and payment records they maintain.",
  "Front-office teams know where to find and update school information.",
  "School leaders understand how the connected records support decisions.",
];

const included = [
  "One live remote session for the school team",
  "Attendance, fees, results, communication, and parent access orientation",
  "Role-based questions answered during the session",
  "Practical implementation guidance for your existing school process",
  "Seven days of training-related follow-up support",
];

const whatsappUrl = "https://wa.me/2349032250338?text=Hello%20SchoolBase%2C%20I%27d%20like%20to%20book%20school-wide%20staff%20training.";

export default function StaffTrainingPage() {
  return (
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">SchoolBase staff enablement</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">Turn your SchoolBase subscription into confident daily adoption.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">Administrator onboarding is included with your subscription. This optional school-wide training helps teachers, bursars, front-office teams, and leaders use the workflows that keep your school moving.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="mailto:info@schoolbase.live?subject=SchoolBase%20staff%20training" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"><Mail className="h-4 w-4" /> Email our team <ArrowRight className="h-4 w-4" /></a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"><MessageCircle className="h-4 w-4" /> WhatsApp is also available</a>
            </div>
          </div>
          <div className="relative min-h-[360px] lg:min-h-[430px]">
            <div className="absolute inset-4 border border-brand/20 bg-white shadow-[18px_18px_0_0_#dcecff] sm:inset-8" />
            <div className="relative flex min-h-[360px] flex-col justify-between border border-brand/30 bg-white p-6 shadow-xl sm:min-h-[430px] sm:p-9">
              <div className="flex items-center justify-between border-b border-border pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">School team readiness</p><p className="mt-2 text-xl font-semibold text-foreground">From access to confidence</p></div><div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><Users className="h-5 w-5" /></div></div>
              <div className="grid grid-cols-2 gap-3"><div className="bg-brand-light p-4"><p className="text-xs text-muted">Teachers</p><p className="mt-3 text-xl font-semibold text-foreground">Ready</p></div><div className="bg-[#fff7e8] p-4"><p className="text-xs text-muted">Bursars</p><p className="mt-3 text-xl font-semibold text-foreground">Clear</p></div><div className="bg-[#f1f7f4] p-4"><p className="text-xs text-muted">Front office</p><p className="mt-3 text-xl font-semibold text-foreground">Aligned</p></div><div className="bg-[#edf7f8] p-4"><p className="text-xs text-muted">Leadership</p><p className="mt-3 text-xl font-semibold text-foreground">Informed</p></div></div>
              <div className="border-t border-border pt-5 text-sm text-muted"><span className="font-semibold text-brand">Built around your school.</span> Practical training for the people who use the platform every day.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The core idea</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">One school. One system. Every role able to contribute.</h2><p className="mt-5 text-lg leading-8 text-muted">SchoolBase works best when the records one person creates become useful to the next. Staff training turns a new subscription into a shared operating habit across the school.</p></div><div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{["School administration", "Teachers & classes", "Fees & payments", "Parents & communication"].map((item, index) => <div key={item} className="flex items-center gap-3 border border-border bg-background px-4 py-4 text-sm font-semibold text-foreground"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs text-white">{String(index + 1).padStart(2, "0")}</span>{item}</div>)}</div></div>
      </section>

      <section className="py-20 sm:py-24"><div className="mx-auto max-w-6xl px-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The service</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Built around the work schools do every day.</h2></div><p className="max-w-md text-base leading-7 text-muted">A focused engagement that helps your team understand what matters and practise the actions they need.</p></div><div className="mt-12 grid gap-4 md:grid-cols-2">{modules.map(({ icon: Icon, eyebrow, title, text }) => <article key={title} className="group border border-border bg-white p-6 transition hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg"><div className="flex h-11 w-11 items-center justify-center bg-brand-light text-brand"><Icon className="h-5 w-5" /></div><p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</p><h3 className="mt-2 text-xl font-semibold text-foreground">{title}</h3><p className="mt-3 leading-7 text-muted">{text}</p></article>)}</div></div></section>

      <section className="border-y border-border bg-[#f6faff] py-20 sm:py-24"><div className="mx-auto max-w-6xl px-6"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">How it works</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">A practical flow from booking to confident use.</h2></div><div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[{ n: "01", t: "Share your context", x: "Tell us your school size, roles, and workflows." }, { n: "02", t: "Plan the session", x: "We shape the session around the work your team needs to do." }, { n: "03", t: "Train together", x: "Your staff joins one focused live remote training session." }, { n: "04", t: "Keep moving", x: "Use seven days of follow-up support to reinforce adoption." }].map((step) => <div key={step.n} className="border-t-2 border-brand bg-white p-6"><p className="text-sm font-bold text-brand">{step.n}</p><h3 className="mt-7 text-xl font-semibold text-foreground">{step.t}</h3><p className="mt-3 leading-7 text-muted">{step.x}</p></div>)}</div></div></section>

      <section className="py-20 sm:py-24"><div className="mx-auto max-w-6xl px-6"><div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-start"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">For the people in your school</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">The right confidence for each role.</h2><p className="mt-5 leading-7 text-muted">Your staff do not need a product tour. They need clarity about the actions they are responsible for and how those actions connect to the school.</p></div><div className="grid gap-3 sm:grid-cols-2">{outcomes.map((outcome) => <div key={outcome} className="border border-border bg-white p-6"><CheckCircle2 className="h-5 w-5 text-brand" /><p className="mt-4 text-sm font-semibold leading-6 text-foreground">{outcome}</p></div>)}</div></div></div></section>

      <section className="border-y border-border bg-white py-20"><div className="mx-auto max-w-6xl px-6"><div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Transparent scope</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">A focused service with a clear starting point.</h2><p className="mt-5 max-w-2xl leading-7 text-muted">Your SchoolBase subscription includes administrator onboarding. School-wide staff training is an optional professional service for teams that want guided adoption across the school.</p><ul className="mt-8 space-y-3 text-sm text-muted">{included.map((item) => <li key={item} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span>{item}</span></li>)}</ul></div><div className="border border-brand/20 bg-[#f6faff] p-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Introductory rate</p><p className="mt-3 text-4xl font-bold text-brand">NGN 28,295</p><p className="mt-1 text-sm text-muted">Per school-wide remote session</p><p className="mt-6 border-l-2 border-brand bg-white px-4 py-3 text-sm leading-6 text-foreground">Additional sessions, on-site delivery, larger teams, and custom training can be quoted separately.</p></div></div></div></section>

      <section className="bg-brand py-16 text-white sm:py-20"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Ready to enable your team?</p><h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Give every part of your school a clearer place to work.</h2><p className="mt-4 text-white/80">Email is the best way to arrange staff training. WhatsApp is also available for quick questions.</p></div><div className="flex flex-wrap gap-3"><a href="mailto:info@schoolbase.live?subject=SchoolBase%20staff%20training" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50"><Mail className="h-4 w-4" /> Email info@schoolbase.live</a><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"><MessageCircle className="h-4 w-4" /> WhatsApp</a></div></div></section>

      <div className="mx-auto flex max-w-6xl flex-wrap gap-3 border-t border-border px-6 py-8 text-sm"><Link href="/platform" className="font-semibold text-brand hover:underline">Explore the SchoolBase platform</Link><Link href="/faq" className="font-semibold text-brand hover:underline">Read the FAQ</Link><Link href="/signup" className="font-semibold text-brand hover:underline">Start your school</Link></div>
    </div>
  );
}

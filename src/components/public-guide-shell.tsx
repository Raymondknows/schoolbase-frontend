import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";

interface PublicGuideShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  relatedHref?: string;
  relatedLabel?: string;
}

export function PublicGuideShell({
  eyebrow,
  title,
  description,
  children,
  relatedHref = "/platform",
  relatedLabel = "Explore the platform",
}: PublicGuideShellProps) {
  return (
    <main className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              {eyebrow}
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              {description}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={relatedHref}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                {relatedLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
              >
                All guides
              </Link>
            </div>
          </div>
          <div className="relative min-h-[360px] lg:min-h-[430px]">
            <div className="absolute inset-4 border border-brand/20 bg-white shadow-[18px_18px_0_0_#dcecff] sm:inset-8" />
            <div className="relative flex min-h-[360px] flex-col justify-between border border-brand/30 bg-white p-6 shadow-xl sm:min-h-[430px] sm:p-9">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    SchoolBase guide
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    Practical knowledge for school teams
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  "Plan",
                  "Choose",
                  "Set up",
                  "Adopt",
                  "Measure",
                  "Improve",
                ].map((item, index) => (
                  <div
                    key={item}
                    className={`${["bg-[#eaf4ff]", "bg-[#f1f7f4]", "bg-[#fff7e8]", "bg-[#f2efff]", "bg-[#edf7f8]", "bg-[#fff0f0]"][index]} border border-black/5 p-4`}
                  >
                    <p className="text-xs text-muted">Step</p>
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-5 text-sm text-muted">
                <span className="font-semibold text-brand">
                  Useful by design.
                </span>{" "}
                Clear guidance for the work schools do every day.
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <article className="prose prose-slate max-w-none prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-muted prose-li:text-muted prose-strong:text-foreground">
            {children}
          </article>
        </div>
      </section>
      <section className="bg-brand py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Put the guidance into practice
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Build a clearer operating system for your school.
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

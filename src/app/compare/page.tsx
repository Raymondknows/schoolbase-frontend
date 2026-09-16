import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Layers3,
  MessageCircle,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Why SchoolBase | Compare School Management Alternatives",
  description:
    "Compare SchoolBase with spreadsheets and complex enterprise software across setup, fees, communication, results, and support.",
};

const comparison = [
  [
    "Implementation time",
    "4-6 weeks of manual setup",
    "8-12 weeks with consultants",
    "Designed for a faster start",
  ],
  [
    "Setup cost",
    "Free software, high staff time",
    "Often includes implementation fees",
    "Free to start",
  ],
  [
    "Fee collection",
    "Manual tracking",
    "Available, often complex",
    "Invoices, tracking, and reminders",
  ],
  [
    "Parent communication",
    "Manual messages",
    "May require add-ons",
    "Connected updates and notifications",
  ],
  [
    "Result publishing",
    "Print or email manually",
    "Available, often complex",
    "Structured digital publishing",
  ],
  [
    "Parent access",
    "Not available",
    "Varies by package",
    "Connected parent experience",
  ],
  [
    "Mobile access",
    "Separate files and devices",
    "Varies by package",
    "Built for everyday school access",
  ],
  [
    "Support",
    "No product support",
    "Business-hours process",
    "Practical support for school teams",
  ],
];

const advantages = [
  {
    icon: Layers3,
    title: "One connected platform",
    text: "Fees, results, attendance, administration, and communication work from the same school records.",
  },
  {
    icon: WalletCards,
    title: "Clearer financial work",
    text: "Make invoices, payments, receipts, and outstanding balances easier to track and explain.",
  },
  {
    icon: MessageCircle,
    title: "Communication where families are",
    text: "Keep important school updates closer to the channels parents already use.",
  },
  {
    icon: ClipboardCheck,
    title: "Less manual repetition",
    text: "Replace duplicated entry and spreadsheet handoffs with structured workflows.",
  },
  {
    icon: ShieldCheck,
    title: "More dependable records",
    text: "Give authorized teams a consistent place to manage important school information.",
  },
  {
    icon: CheckCircle2,
    title: "Built for practical adoption",
    text: "Start with the workflows your school needs now and expand as your operation grows.",
  },
];

const wins = [
  "Bring core school operations into one system",
  "Reduce repeated spreadsheet and paper work",
  "Give leaders faster visibility into school activity",
  "Keep parents closer to fees, attendance, results, and updates",
  "Start with a practical implementation path",
  "Build a stronger foundation as the school grows",
];
const proofTiles = [
  ["Setup", "Faster", "bg-[#eaf4ff]"],
  ["Records", "Connected", "bg-[#f1f7f4]"],
  ["Fees", "Visible", "bg-[#fff7e8]"],
  ["Results", "Digital", "bg-[#f2efff]"],
  ["Parents", "Informed", "bg-[#edf7f8]"],
  ["Support", "Practical", "bg-[#fff0f0]"],
];

export default function ComparisonPage() {
  return (
    <main className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Compare your options
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Choose a school system that fits the way your team works.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Compare disconnected spreadsheets, complex enterprise tools, and
              SchoolBase across the workflows that shape a school day.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#comparison"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
              >
                View comparison
              </Link>
            </div>
          </div>
          <div className="relative min-h-[360px] lg:min-h-[430px]">
            <div className="absolute inset-4 border border-brand/20 bg-white shadow-[18px_18px_0_0_#dcecff] sm:inset-8" />
            <div className="relative flex min-h-[360px] flex-col justify-between border border-brand/30 bg-white p-6 shadow-xl sm:min-h-[430px] sm:p-9">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    The SchoolBase difference
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    Connected work, clearer decisions
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white">
                  <Layers3 className="h-5 w-5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {proofTiles.map(([label, value, tone]) => (
                  <div
                    key={label}
                    className={[tone, "border border-black/5 p-4"].join(" ")}
                  >
                    <p className="text-xs text-muted">{label}</p>
                    <p className="mt-3 text-xl font-semibold text-foreground">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-5 text-sm text-muted">
                <span className="font-semibold text-brand">
                  Made for schools.
                </span>{" "}
                The right comparison is about fit, clarity, and daily
                usefulness.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="comparison" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              The comparison
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              See how the operating model changes.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              The right platform should make the core work easier to manage, not
              add another layer of complexity.
            </p>
          </div>
          <div className="mt-12 overflow-x-auto border border-border bg-white">
            <table className="min-w-[760px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-[#f6faff]">
                  <th className="px-5 py-4 text-sm font-semibold text-foreground">
                    School workflow
                  </th>
                  <th className="px-5 py-4 text-sm font-semibold text-muted">
                    Spreadsheets
                  </th>
                  <th className="px-5 py-4 text-sm font-semibold text-muted">
                    Enterprise tools
                  </th>
                  <th className="bg-brand px-5 py-4 text-sm font-semibold text-white">
                    SchoolBase
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(
                  ([feature, spreadsheet, enterprise, schoolbase], index) => (
                    <tr
                      key={feature}
                      className="border-b border-border last:border-0"
                    >
                      <th className="px-5 py-5 text-sm font-semibold text-foreground">
                        {feature}
                      </th>
                      <td className="px-5 py-5 text-sm leading-6 text-muted">
                        {spreadsheet}
                      </td>
                      <td className="px-5 py-5 text-sm leading-6 text-muted">
                        {enterprise}
                      </td>
                      <td
                        className={
                          index % 2 === 0
                            ? "bg-[#f6faff] px-5 py-5 text-sm font-semibold leading-6 text-brand"
                            : "bg-[#edf5ff] px-5 py-5 text-sm font-semibold leading-6 text-brand"
                        }
                      >
                        {schoolbase}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-[#f6faff] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              What makes the difference
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              A system your school team can actually use.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {advantages.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="border border-border bg-white p-6 transition hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center bg-brand-light text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              The practical wins
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Move forward with less operational drag.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wins.map((win) => (
              <div
                key={win}
                className="flex items-start gap-3 border border-border bg-white p-5"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <span className="text-sm leading-7 text-foreground">{win}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Make the switch thoughtfully
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              See whether SchoolBase is the right fit for your school.
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

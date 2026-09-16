import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Globe2,
  HeartHandshake,
  Linkedin,
  Mail,
  MessageCircle,
  Rocket,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Nwokpor Raymond Ikenna | Founder and CEO, ClickBase Group",
  description:
    "Meet Nwokpor Raymond Ikenna, founder and technology leader behind ClickBase Group and its SaaS products.",
};

const principles = [
  {
    icon: Code2,
    title: "Technical excellence",
    text: "Build systems with clear architecture, disciplined delivery, and a product experience people can use.",
  },
  {
    icon: HeartHandshake,
    title: "Remove complexity",
    text: "Start with a real customer problem and make the daily workflow easier to understand and manage.",
  },
  {
    icon: Globe2,
    title: "Local roots, wide reach",
    text: "Build from Africa with the quality, ambition, and operating discipline required for broader markets.",
  },
];

const portfolio = [
  {
    name: "SchoolBase",
    description:
      "Connected school management for administration, academics, fees, communication, and parents.",
    href: "https://schoolbase.live",
    label: "Visit SchoolBase",
  },
  {
    name: "ClickInvoice",
    description:
      "Cloud-based invoicing and business management for growing companies.",
    href: "https://clickinvoice.app",
    label: "Visit ClickInvoice",
  },
  {
    name: "TradeBase",
    description:
      "A trading workspace focused on market intelligence, automation, and risk-aware execution.",
    href: "https://tradebase.live",
    label: "Visit TradeBase",
  },
  {
    name: "ClickBase Group",
    description:
      "The group behind a portfolio of software products and digital solutions.",
    href: "https://clickbasegroup.com",
    label: "Visit ClickBase Group",
  },
];

export default function FounderPage() {
  return (
    <main className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div className="relative mx-auto w-full max-w-[430px] lg:order-2">
            <div className="absolute inset-4 border border-brand/20 bg-white shadow-[18px_18px_0_0_#dcecff] sm:inset-8" />
            <div className="relative aspect-[4/5] overflow-hidden border border-brand/30 bg-white p-3 shadow-xl sm:p-5">
              <Image
                src="/ray.png"
                alt="Nwokpor Raymond Ikenna"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
          <div className="relative z-10 lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Founder and technology leader
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Nwokpor Raymond Ikenna
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Founder of SchoolBase, Founder and CEO of TradeBase and
              ClickInvoice, and Chairman of ClickBase Group. Raymond builds
              software businesses that turn complex operational work into
              clearer digital systems.
            </p>
            <div className="mt-8 space-y-2 text-sm font-semibold text-foreground">
              <p>Founder, SchoolBase</p>
              <p>Founder and CEO, TradeBase</p>
              <p>Founder and CEO, ClickInvoice Ltd</p>
              <p>Chairman, ClickBase Group</p>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="https://www.linkedin.com/in/nwokpor-raymond-ikenna-652b9a151/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
              <a
                href="mailto:chairman@clickbasegroup.com"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground hover:border-brand hover:text-brand"
              >
                <Mail className="h-4 w-4" /> Email
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                The founder's approach
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                Build useful systems, then make them dependable.
              </h2>
            </div>
            <div className="space-y-5 text-lg leading-8 text-muted">
              <p>
                Raymond's work is grounded in a simple idea: software should
                remove complexity from the work people already need to do. That
                means understanding the workflow first, choosing the right level
                of structure, and delivering tools that can grow with the
                customer.
              </p>
              <p>
                Through ClickBase Group, he leads a distributed team building
                SaaS products for business, trading, and education. The focus is
                practical execution: solve real problems, listen closely, and
                keep improving the system.
              </p>
              <blockquote className="border-l-2 border-brand pl-5 text-xl font-semibold text-foreground">
                "Technology should remove complexity from business."
              </blockquote>
            </div>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {principles.map(({ icon: Icon, title, text }) => (
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

      <section className="border-y border-border bg-[#f6faff] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              The product ecosystem
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              A portfolio built around practical digital work.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              Each product serves a different operating context while sharing
              the same commitment to clear workflows, useful information, and
              disciplined execution.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {portfolio.map((product) => (
              <a
                key={product.name}
                href={product.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-border bg-white p-6 transition hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center bg-brand-light text-brand">
                    <Rocket className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted transition group-hover:translate-x-1 group-hover:text-brand" />
                </div>
                <h3 className="mt-7 text-xl font-semibold text-foreground group-hover:text-brand">
                  {product.name}
                </h3>
                <p className="mt-3 leading-7 text-muted">
                  {product.description}
                </p>
                <span className="mt-6 inline-flex text-sm font-semibold text-brand">
                  {product.label} <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-border bg-white p-6">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <h3 className="mt-5 text-xl font-semibold text-foreground">
                Customer-first execution
              </h3>
              <p className="mt-3 leading-7 text-muted">
                Products begin with the problems customers are actually
                experiencing, not abstract feature lists.
              </p>
            </div>
            <div className="border border-border bg-white p-6">
              <Globe2 className="h-5 w-5 text-brand" />
              <h3 className="mt-5 text-xl font-semibold text-foreground">
                Designed for scale
              </h3>
              <p className="mt-3 leading-7 text-muted">
                Strong foundations make it possible to improve the product
                without losing clarity as usage grows.
              </p>
            </div>
            <div className="border border-border bg-white p-6">
              <MessageCircle className="h-5 w-5 text-brand" />
              <h3 className="mt-5 text-xl font-semibold text-foreground">
                Open conversations
              </h3>
              <p className="mt-3 leading-7 text-muted">
                Raymond welcomes conversations with founders, institutions, and
                teams building useful technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Connect with Raymond
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Explore the products and teams behind the work.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://wa.me/2349031368963"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <Link
              href="/platform"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Explore SchoolBase <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

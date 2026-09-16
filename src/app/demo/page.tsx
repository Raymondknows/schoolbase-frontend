import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContentItem, ContentSection, PublicContentShell } from "@/components/public-content-shell";

export const metadata: Metadata = {
  title: "SchoolBase Walkthrough | See the Platform",
  description: "Talk with SchoolBase about your school's operations and see how the platform connects administration, academics, fees, communication, and parents.",
  openGraph: {
    title: "See SchoolBase in a Walkthrough",
    description: "Explore the connected SchoolBase platform with a member of the team.",
    url: "https://schoolbase.live/demo",
    type: "website",
  },
};

const agenda = [
  { title: "School administration", text: "See how school records, staff roles, students, and guardians fit into one operating view." },
  { title: "Academics and results", text: "Walk through classes, assessments, academic records, result publishing, and parent access." },
  { title: "Fees and accounting", text: "Understand fee schedules, invoices, payments, receipts, balances, and connected financial records." },
  { title: "Communication", text: "See how schools can organise updates and keep parents informed through connected workflows." },
  { title: "Parents and roles", text: "Explore the different views available to school teams and families across the platform." },
  { title: "Reports and visibility", text: "See how school leaders can work from clearer information across daily operations." },
];

export default function DemoPage() {
  return (
    <PublicContentShell
      eyebrow="SchoolBase walkthrough"
      title="See how your school could work with one connected platform."
      description="Talk with the SchoolBase team about your school and get a guided look at the areas that matter most: administration, academics, fees, accounting, communication, reporting, and parents."
      ctaTitle="Ready to see SchoolBase in context?"
      ctaText="Send us a note with your school name and the workflows you want to improve. We will help arrange the right walkthrough."
      ctaHref="mailto:support@schoolbase.live?subject=SchoolBase%20walkthrough%20request"
      ctaLabel="Request a Walkthrough"
    >
      <ContentSection title="What we can walk through" intro="A walkthrough is shaped around your school rather than a fictional dashboard or generic presentation.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agenda.map(({ title, text }) => (
            <ContentItem key={title} title={title} text={text} />
          ))}
        </div>
      </ContentSection>

      <ContentSection title="Choose your next step" intro="Explore the platform on your own, start setting up a school account, or contact the team for a guided conversation.">
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/platform" className="group border border-border bg-white p-6 hover:border-brand/50 hover:shadow-lg">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-brand">Explore the platform</h3>
            <p className="mt-2 text-sm leading-7 text-muted">Understand how the major SchoolBase areas connect before you speak with us.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">View platform <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/signup" className="group border border-border bg-white p-6 hover:border-brand/50 hover:shadow-lg">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-brand">Start your school</h3>
            <p className="mt-2 text-sm leading-7 text-muted">Create a school account and begin the guided onboarding flow.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">Get started <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>
          <a href="https://wa.me/2349031368963" target="_blank" rel="noopener noreferrer" className="group border border-border bg-white p-6 hover:border-brand/50 hover:shadow-lg">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-brand">Talk on WhatsApp</h3>
            <p className="mt-2 text-sm leading-7 text-muted">Message the team with your school name and the areas you want to see.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">Start a conversation <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </a>
        </div>
      </ContentSection>
    </PublicContentShell>
  );
}

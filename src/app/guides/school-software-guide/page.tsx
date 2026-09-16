import type { Metadata } from "next";
import {
  ClipboardCheck,
  Layers3,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { PublicGuideShell } from "@/components/public-guide-shell";
export const metadata: Metadata = {
  title: "School Software Buying Guide | SchoolBase",
  description:
    "A practical framework for evaluating school management software, workflows, adoption, and support.",
};
export default function SchoolSoftwareGuidePage() {
  return (
    <PublicGuideShell
      eyebrow="Guide: choosing school software"
      title="Choose a school platform by the work it helps your team do."
      description="Use this practical checklist to evaluate school management software for your people, processes, records, communication, and growth."
      relatedHref="/compare"
      relatedLabel="Compare options"
    >
      <h2>Start with your school’s operating needs</h2>
      <p>
        Good software should fit the school’s daily rhythm. Begin with workflows
        that consume the most time or create the most uncertainty, then ask
        whether the platform connects them.
      </p>
      <h2>Questions to ask during evaluation</h2>
      <div className="not-prose grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: Layers3,
            title: "Does it connect the work?",
            text: "Check how student records, fees, attendance, results, communication, and reports relate.",
          },
          {
            icon: ClipboardCheck,
            title: "Can the team use it?",
            text: "Evaluate workflows for teachers, bursars, administrators, leaders, and parents.",
          },
          {
            icon: ShieldCheck,
            title: "Are records dependable?",
            text: "Ask how roles, access, history, and regular school processes are handled.",
          },
          {
            icon: MessageCircle,
            title: "What support exists?",
            text: "Understand onboarding, training, response paths, and how feedback is handled.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="border border-border bg-white p-5">
            <Icon className="h-5 w-5 text-brand" />
            <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted">{text}</p>
          </div>
        ))}
      </div>
      <h2>A simple evaluation checklist</h2>
      <ul>
        <li>Map the workflows your school needs today.</li>
        <li>Review how the platform connects them.</li>
        <li>Test the experience with the people who will use it.</li>
        <li>
          Confirm onboarding, support, pricing, and implementation expectations.
        </li>
      </ul>
      <p>
        Use the <a href="/compare">SchoolBase comparison center</a> to compare
        common alternatives, then explore the{" "}
        <a href="/platform">full platform</a>.
      </p>
    </PublicGuideShell>
  );
}

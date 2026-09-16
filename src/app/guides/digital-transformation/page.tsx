import type { Metadata } from "next";
import { ClipboardList, Layers3, Users } from "lucide-react";
import { PublicGuideShell } from "@/components/public-guide-shell";
export const metadata: Metadata = {
  title: "School Digital Transformation Guide | SchoolBase",
  description:
    "A practical guide to moving school operations from disconnected paper and spreadsheet processes into a connected system.",
};
export default function DigitalTransformationGuidePage() {
  return (
    <PublicGuideShell
      eyebrow="Guide: digital transformation"
      title="Move your school forward one connected workflow at a time."
      description="Digital transformation does not mean changing everything at once. It means choosing recurring school work where better records and clearer handoffs create the most value."
      relatedHref="/platform"
      relatedLabel="Explore the platform"
    >
      <h2>Start with the work, not the technology</h2>
      <p>
        Map how your school handles students, fees, attendance, results,
        communication, and reporting. Identify repeated entry, delayed
        follow-up, and records that are difficult to reconcile.
      </p>
      <h2>Three principles for a practical transition</h2>
      <div className="not-prose grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: ClipboardList,
            title: "Choose a first workflow",
            text: "Start with a process the team understands and can measure, such as fees or results.",
          },
          {
            icon: Users,
            title: "Bring people into the plan",
            text: "Teachers, bursars, administrators, leaders, and parents each experience change differently.",
          },
          {
            icon: Layers3,
            title: "Connect the records",
            text: "The long-term value comes from making one team’s work useful to the next.",
          },
          {
            icon: ClipboardList,
            title: "Review and improve",
            text: "Use feedback from real school days to refine the workflow after launch.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="border border-border bg-white p-5">
            <Icon className="h-5 w-5 text-brand" />
            <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted">{text}</p>
          </div>
        ))}
      </div>
      <h2>A sensible sequence</h2>
      <ol>
        <li>Document the current process and its friction points.</li>
        <li>Choose the first SchoolBase area to adopt.</li>
        <li>Prepare records, roles, and communication.</li>
        <li>Launch, observe, and expand into connected workflows.</li>
      </ol>
    </PublicGuideShell>
  );
}

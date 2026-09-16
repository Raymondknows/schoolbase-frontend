import type { Metadata } from "next";
import { BarChart3, FileText, GraduationCap } from "lucide-react";
import { PublicGuideShell } from "@/components/public-guide-shell";
export const metadata: Metadata = {
  title: "Digital Report Cards Guide | SchoolBase",
  description:
    "Practical guidance for moving from paper report cards to structured digital results and parent access.",
};
export default function ReportCardsGuidePage() {
  return (
    <PublicGuideShell
      eyebrow="Guide: digital report cards"
      title="Make results clearer for teachers, leaders, and families."
      description="Learn how to move from paper reports to a consistent process for entering results, applying grades, generating reports, and sharing them with parents."
      relatedHref="/solutions/digital-result-management"
      relatedLabel="See result management"
    >
      <h2>Why digital report cards matter</h2>
      <p>
        A report card brings together student identity, subjects, scores,
        grades, positioning, attendance, and remarks. A connected process makes
        the information more consistent and easier to share.
      </p>
      <h2>Build the report around useful context</h2>
      <div className="not-prose grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: GraduationCap,
            title: "Student and class context",
            text: "Identify the student, class, academic year, and term clearly.",
          },
          {
            icon: BarChart3,
            title: "Scores and grades",
            text: "Present subject performance in a way teachers and parents can understand.",
          },
          {
            icon: FileText,
            title: "Remarks and reports",
            text: "Give teachers a consistent place to add useful academic context.",
          },
          {
            icon: GraduationCap,
            title: "Controlled publishing",
            text: "Review results before making them available to families.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="border border-border bg-white p-5">
            <Icon className="h-5 w-5 text-brand" />
            <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted">{text}</p>
          </div>
        ))}
      </div>
      <h2>A practical rollout</h2>
      <ol>
        <li>Agree the grading and report structure.</li>
        <li>Configure classes, subjects, and assessment periods.</li>
        <li>Let teachers enter and review results.</li>
        <li>
          Generate reports and publish them through the parent experience.
        </li>
      </ol>
      <p>
        See the <a href="/docs/academics">academics documentation</a> for how
        results connect to the wider SchoolBase platform.
      </p>
    </PublicGuideShell>
  );
}

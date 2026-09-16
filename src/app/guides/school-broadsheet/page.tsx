import type { Metadata } from "next";
import { BarChart3, FileSpreadsheet, Search } from "lucide-react";
import { PublicGuideShell } from "@/components/public-guide-shell";
export const metadata: Metadata = {
  title: "School Broadsheet Guide | SchoolBase",
  description:
    "Understand how a digital school broadsheet helps teams review student and subject performance.",
};
export default function SchoolBroadsheetGuidePage() {
  return (
    <PublicGuideShell
      eyebrow="Guide: school broadsheets"
      title="Turn many result records into one clearer academic view."
      description="A school broadsheet brings students, subjects, scores, and performance patterns together so teams can review academic work with less manual sorting."
      relatedHref="/solutions/school-broadsheet"
      relatedLabel="See the broadsheet"
    >
      <h2>What a broadsheet should help you see</h2>
      <p>
        The useful question is not just whether a result exists. It is whether
        the school can understand class performance, compare subjects, identify
        gaps, and decide where support is needed.
      </p>
      <h2>Make the view useful to the whole team</h2>
      <div className="not-prose grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: FileSpreadsheet,
            title: "Consistent records",
            text: "Keep result information in a structured view instead of separate term files.",
          },
          {
            icon: Search,
            title: "Find patterns",
            text: "Review students and subjects without manually searching through multiple sheets.",
          },
          {
            icon: BarChart3,
            title: "Support decisions",
            text: "Use performance visibility to guide conversations and academic planning.",
          },
          {
            icon: FileSpreadsheet,
            title: "Share responsibly",
            text: "Export or share the information your school needs for review and reporting.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="border border-border bg-white p-5">
            <Icon className="h-5 w-5 text-brand" />
            <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted">{text}</p>
          </div>
        ))}
      </div>
      <h2>Where it fits in SchoolBase</h2>
      <p>
        The broadsheet connects to the wider results workflow: assessments are
        entered, grades and positions are calculated, reports are prepared, and
        the right information can reach parents. See the{" "}
        <a href="/docs/reports">reports documentation</a> for the broader
        reporting context.
      </p>
    </PublicGuideShell>
  );
}

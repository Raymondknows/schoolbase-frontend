import type { Metadata } from "next";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageCircle,
  WalletCards,
} from "lucide-react";
import { PublicComparisonShell } from "@/components/public-comparison-shell";

export const metadata: Metadata = {
  title: "SchoolBase vs Google Forms | School Management Comparison",
  description:
    "Compare Google Forms with SchoolBase for attendance, fees, results, communication, and school workflows.",
};

export default function VsGoogleFormsPage() {
  return (
    <PublicComparisonShell
      eyebrow="Compare SchoolBase and Google Forms"
      title="A form collects an answer. A school platform connects the work around it."
      description="Google Forms can capture information quickly. SchoolBase is designed for the wider workflows that follow: attendance, fees, results, records, communication, and reporting."
      alternativeName="Google Forms"
      proofTitle="From captured data to useful school work"
      proofTiles={[
        "Attendance workflow",
        "Fee tracking",
        "Results publishing",
        "Parent updates",
        "School records",
        "Operational reports",
      ]}
      sectionTitle="See where a form ends and a workflow begins."
      ctaTitle="Move from collecting information to running the work around it."
      rows={[
        {
          feature: "Attendance",
          alternative: "Collect responses in a form",
          schoolbase: "Mark, track, review, and follow up",
        },
        {
          feature: "Fee collection",
          alternative: "No billing workflow by itself",
          schoolbase: "Schedules, invoices, payments, and receipts",
        },
        {
          feature: "Results",
          alternative: "Collect or export responses",
          schoolbase: "Manage entry, grading, reports, and publishing",
        },
        {
          feature: "Parent communication",
          alternative: "Requires separate tools and follow-up",
          schoolbase: "Connected updates for families",
        },
        {
          feature: "Student records",
          alternative: "Responses need separate organization",
          schoolbase: "Records support multiple school areas",
        },
        {
          feature: "Reporting",
          alternative: "Build reports from exported data",
          schoolbase: "School workflows produce usable summaries",
        },
      ]}
      points={[
        {
          icon: ClipboardList,
          title: "Purpose-built workflows",
          description:
            "Use focused school workflows instead of rebuilding forms and spreadsheets for each task.",
        },
        {
          icon: WalletCards,
          title: "Fees beyond data capture",
          description:
            "Track the financial process around what is due, paid, receipted, and outstanding.",
        },
        {
          icon: FileText,
          title: "Results beyond responses",
          description:
            "Move from entering scores to grading, reports, and controlled parent access.",
        },
        {
          icon: MessageCircle,
          title: "Communication in context",
          description:
            "Keep updates connected to the school activity families need to understand.",
        },
        {
          icon: Bell,
          title: "Follow-up becomes visible",
          description:
            "Make attendance, payment, and academic follow-up easier for staff to see.",
        },
        {
          icon: CheckCircle2,
          title: "One place for recurring work",
          description:
            "Give school teams a system designed around their daily operating rhythm.",
        },
      ]}
    />
  );
}

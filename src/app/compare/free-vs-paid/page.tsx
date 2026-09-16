import type { Metadata } from "next";
import {
  BarChart3,
  CheckCircle2,
  DatabaseBackup,
  FileWarning,
  Headphones,
  Workflow,
} from "lucide-react";
import { PublicComparisonShell } from "@/components/public-comparison-shell";

export const metadata: Metadata = {
  title: "Free vs Paid School Management Software | SchoolBase",
  description:
    "Understand the practical tradeoffs between free tools and a connected school management platform.",
};

export default function FreeVsPaidPage() {
  return (
    <PublicComparisonShell
      eyebrow="Free tools or a school platform"
      title="The real question is not free or paid. It is what your school needs to run well."
      description="Free spreadsheets and general-purpose tools can help with isolated tasks. A school platform becomes useful when records, workflows, communication, and reporting need to work together."
      alternativeName="Free tools"
      proofTitle="The value of connected work"
      proofTiles={[
        "Less repeated entry",
        "Clearer records",
        "Structured workflows",
        "Parent visibility",
        "Reliable reporting",
        "Support when needed",
      ]}
      sectionTitle="Compare the total operating experience."
      ctaTitle="Give your school a stronger foundation than disconnected tools."
      alternativeTone="warning"
      rows={[
        {
          feature: "Starting cost",
          alternative: "Low or no license cost",
          schoolbase: "Subscription for a connected platform",
        },
        {
          feature: "Student records",
          alternative: "Often split across files and tools",
          schoolbase: "Structured records used across workflows",
        },
        {
          feature: "Fee collection",
          alternative: "Manual tracking and follow-up",
          schoolbase: "Fee schedules, invoices, payments, and receipts",
        },
        {
          feature: "Results and reports",
          alternative: "Manual calculations and document work",
          schoolbase: "Connected assessment and reporting workflows",
        },
        {
          feature: "Communication",
          alternative: "Separate messages and channels",
          schoolbase: "School updates connected to the platform",
        },
        {
          feature: "Support",
          alternative: "Self-service or community help",
          schoolbase: "Support for school onboarding and use",
        },
      ]}
      points={[
        {
          icon: Workflow,
          title: "Less tool switching",
          description:
            "Bring the recurring work of a school into connected workflows instead of isolated files.",
        },
        {
          icon: DatabaseBackup,
          title: "More dependable records",
          description:
            "Keep important school information in a structured system that teams can use consistently.",
        },
        {
          icon: FileWarning,
          title: "Fewer manual handoffs",
          description:
            "Reduce the copying, recalculating, and reformatting that creates avoidable friction.",
        },
        {
          icon: BarChart3,
          title: "Better visibility",
          description:
            "Give school leaders clearer information for finance, academics, attendance, and planning.",
        },
        {
          icon: Headphones,
          title: "A support path",
          description:
            "Have a product and team designed around the practical needs of school operations.",
        },
        {
          icon: CheckCircle2,
          title: "A foundation that grows",
          description:
            "Start with core workflows and expand as your school’s needs become more sophisticated.",
        },
      ]}
    />
  );
}

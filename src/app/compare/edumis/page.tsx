import type { Metadata } from "next";
import {
  BarChart3,
  CheckCircle2,
  MessageCircle,
  Smartphone,
  WalletCards,
  Zap,
} from "lucide-react";
import { PublicComparisonShell } from "@/components/public-comparison-shell";

export const metadata: Metadata = {
  title: "SchoolBase vs EduMIS | School Management Comparison",
  description:
    "Compare SchoolBase and EduMIS across school workflows, implementation, communication, fees, results, and support.",
};

export default function VsEduMISPage() {
  return (
    <PublicComparisonShell
      eyebrow="Compare SchoolBase and EduMIS"
      title="Choose the school platform that fits your team and operating reality."
      description="EduMIS and SchoolBase take different approaches to school management. Compare the practical workflows, adoption experience, and connected capabilities that matter to your school."
      alternativeName="EduMIS"
      proofTitle="Connected school work, practical adoption"
      proofTiles={[
        "School workflows",
        "Fee visibility",
        "Results publishing",
        "Parent communication",
        "Mobile access",
        "Support path",
      ]}
      sectionTitle="Compare the work behind the software."
      ctaTitle="See whether SchoolBase is the right fit for your school."
      rows={[
        {
          feature: "School records",
          alternative: "Centralized school management",
          schoolbase: "Connected records across modules",
        },
        {
          feature: "Fee management",
          alternative: "Available within the platform",
          schoolbase: "Schedules, invoices, payments, and receipts",
        },
        {
          feature: "Parent communication",
          alternative: "Depends on available channels",
          schoolbase: "Connected school and parent updates",
        },
        {
          feature: "Results publishing",
          alternative: "Academic result workflows",
          schoolbase: "Entry, grading, reports, and parent access",
        },
        {
          feature: "Mobile access",
          alternative: "Check package and device fit",
          schoolbase: "Responsive access for school teams",
        },
        {
          feature: "Implementation",
          alternative: "Plan around your school setup",
          schoolbase: "Practical onboarding with school support",
        },
      ]}
      points={[
        {
          icon: WalletCards,
          title: "Clearer finance workflows",
          description:
            "Keep fee schedules, invoices, payment records, and receipts easier to follow.",
        },
        {
          icon: BarChart3,
          title: "Connected academic work",
          description:
            "Move from assessment entry to reports and parent access through one workflow.",
        },
        {
          icon: MessageCircle,
          title: "Closer parent communication",
          description:
            "Keep families closer to important school updates and results.",
        },
        {
          icon: Smartphone,
          title: "Useful on everyday devices",
          description:
            "Give staff a responsive experience that fits how school work happens.",
        },
        {
          icon: CheckCircle2,
          title: "One operating picture",
          description:
            "Help leaders understand activity across the school without stitching together separate records.",
        },
        {
          icon: Zap,
          title: "A practical starting point",
          description:
            "Adopt the workflows your school needs now and build from a connected foundation.",
        },
      ]}
    />
  );
}

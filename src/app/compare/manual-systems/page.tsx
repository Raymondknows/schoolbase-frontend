import type { Metadata } from "next";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  MessageCircle,
  WalletCards,
} from "lucide-react";
import { PublicComparisonShell } from "@/components/public-comparison-shell";

export const metadata: Metadata = {
  title: "SchoolBase vs Manual Systems | School Management Comparison",
  description:
    "Compare digital school management with paper and spreadsheet-based workflows across time, records, fees, results, and communication.",
};

export default function VsManualPage() {
  return (
    <PublicComparisonShell
      eyebrow="Compare SchoolBase and manual systems"
      title="Replace repeated paper and spreadsheet work with a clearer school workflow."
      description="Manual systems can work for isolated tasks, but they become harder to control as students, staff, classes, fees, and reporting needs grow. SchoolBase connects the recurring work."
      alternativeName="Manual systems"
      proofTitle="From repeated work to connected flow"
      proofTiles={[
        "Faster attendance",
        "Clearer fee records",
        "Digital results",
        "Parent updates",
        "Searchable history",
        "Operational insight",
      ]}
      sectionTitle="Compare the daily work your team carries."
      ctaTitle="Give your school a more dependable way to operate."
      rows={[
        {
          feature: "Attendance",
          alternative: "Paper registers and manual summaries",
          schoolbase: "Digital attendance and useful follow-up",
        },
        {
          feature: "Results",
          alternative: "Separate sheets and calculations",
          schoolbase: "Structured entry, grading, and reports",
        },
        {
          feature: "Fee records",
          alternative: "Ledgers and manual reconciliation",
          schoolbase: "Invoices, payments, receipts, and balances",
        },
        {
          feature: "Parent updates",
          alternative: "Letters, calls, and scattered messages",
          schoolbase: "Connected school communication",
        },
        {
          feature: "History",
          alternative: "Physical files and separate spreadsheets",
          schoolbase: "Searchable records across school work",
        },
        {
          feature: "Reports",
          alternative: "Compile by hand when needed",
          schoolbase: "Clearer summaries from connected records",
        },
      ]}
      points={[
        {
          icon: Clock3,
          title: "Less repeated entry",
          description:
            "Reduce the time spent moving the same information between paper files and spreadsheets.",
        },
        {
          icon: WalletCards,
          title: "Clearer fee follow-up",
          description:
            "Make outstanding balances and payment history easier for staff and families to understand.",
        },
        {
          icon: FileText,
          title: "More consistent results work",
          description:
            "Give teachers and leaders a repeatable route from scores to reports.",
        },
        {
          icon: MessageCircle,
          title: "Faster communication",
          description:
            "Keep important updates from depending on manual calls, notes, or one-off messages.",
        },
        {
          icon: BarChart3,
          title: "Useful school insight",
          description:
            "Turn recurring records into information leaders can review and act on.",
        },
        {
          icon: CheckCircle2,
          title: "A stronger foundation",
          description:
            "Create an operating base that supports the school as its people and processes grow.",
        },
      ]}
    />
  );
}

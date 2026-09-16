import type { Metadata } from "next";
import { CreditCard, FileText, MessageCircle, WalletCards } from "lucide-react";
import { PublicGuideShell } from "@/components/public-guide-shell";
export const metadata: Metadata = {
  title: "School Fee Management Guide | SchoolBase",
  description:
    "Practical guidance for clearer fee structures, invoices, payment tracking, and parent follow-up.",
};
export default function FeeManagementGuidePage() {
  return (
    <PublicGuideShell
      eyebrow="Guide: school fee management"
      title="Build a fee process that parents understand and bursars can control."
      description="A practical guide to structuring fees, issuing clear invoices, recording payments, and keeping follow-up consistent."
      relatedHref="/solutions/school-fee-management"
      relatedLabel="See fee management"
    >
      <h2>Why fee management needs a system</h2>
      <p>
        Fee collection touches school finance, parent communication, receipts,
        and planning. When those records are separated, it becomes harder to
        know what is due, what has been paid, and which conversations need
        attention.
      </p>
      <h2>Four practices for clearer collections</h2>
      <div className="not-prose grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: FileText,
            title: "Define the structure",
            text: "Group charges clearly by class, term, and purpose so families know what they are paying for.",
          },
          {
            icon: CreditCard,
            title: "Issue clear invoices",
            text: "Show the amount, due date, student, and available payment path in one place.",
          },
          {
            icon: WalletCards,
            title: "Record every payment",
            text: "Keep payment history and receipts consistent so questions can be answered quickly.",
          },
          {
            icon: MessageCircle,
            title: "Follow up consistently",
            text: "Use timely reminders and clear communication instead of relying on memory.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="border border-border bg-white p-5">
            <Icon className="h-5 w-5 text-brand" />
            <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted">{text}</p>
          </div>
        ))}
      </div>
      <h2>How SchoolBase supports the workflow</h2>
      <p>
        SchoolBase connects fee schedules, invoices, payment records, receipts,
        and parent communication so the school team can work from a clearer
        financial picture. Explore the{" "}
        <a href="/docs/fees">fees documentation</a> for the product workflow.
      </p>
      <h2>A simple implementation sequence</h2>
      <ol>
        <li>Agree the fee structure and due dates.</li>
        <li>Set up classes, students, and fee items.</li>
        <li>Issue invoices and communicate the payment process.</li>
        <li>
          Review collections, receipts, and outstanding balances regularly.
        </li>
      </ol>
    </PublicGuideShell>
  );
}

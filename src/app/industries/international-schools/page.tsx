import type { Metadata } from "next";
import { BookOpen, Globe2, MessageCircle, WalletCards } from "lucide-react";
import { PublicIndustryShell } from "@/components/public-industry-shell";
export const metadata: Metadata = {
  title: "International School Management Software | SchoolBase",
  description:
    "A connected operational foundation for international schools with diverse curricula, families, and reporting needs.",
};
export default function InternationalSchoolsPage() {
  return (
    <PublicIndustryShell
      eyebrow="For international schools"
      title="A clearer operating foundation for schools with global communities."
      description="International schools coordinate diverse academic structures, families, and operational expectations. SchoolBase connects the core records while leaving room for your school context."
      proofTitle="International school view"
      proofTiles={[
        "Flexible records",
        "Fee visibility",
        "Parent communication",
        "Academic reporting",
        "Multi-campus context",
        "Operational clarity",
      ]}
      sectionTitle="Coordinate a diverse school community with one connected system."
      ctaTitle="Build a more dependable foundation for your international school."
      features={[
        {
          icon: BookOpen,
          title: "Flexible academic records",
          description:
            "Keep classes, subjects, assessments, results, and reports organized around your school structure.",
        },
        {
          icon: WalletCards,
          title: "Clearer fee operations",
          description:
            "Bring schedules, invoices, payments, receipts, and family communication into one workflow.",
        },
        {
          icon: Globe2,
          title: "Community visibility",
          description:
            "Give school teams a clearer view of the records and operations that span a diverse community.",
        },
        {
          icon: MessageCircle,
          title: "Parent communication",
          description:
            "Keep families informed through consistent updates around results, fees, attendance, and school activity.",
        },
        {
          icon: BookOpen,
          title: "Reporting context",
          description:
            "Prepare clearer academic and operational information for leaders and school stakeholders.",
        },
        {
          icon: Globe2,
          title: "Room to grow",
          description:
            "Use a connected platform that can support evolving school structures and operating needs.",
        },
      ]}
    />
  );
}

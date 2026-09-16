import type { Metadata } from "next";
import { BarChart3, BookOpen, ClipboardList, Users } from "lucide-react";
import { PublicIndustryShell } from "@/components/public-industry-shell";
export const metadata: Metadata = {
  title: "Secondary School Management Software | SchoolBase",
  description:
    "Structured school management workflows for secondary schools, subjects, assessments, results, and reporting.",
};
export default function SecondarySchoolsPage() {
  return (
    <PublicIndustryShell
      eyebrow="For secondary schools"
      title="Structured workflows for more complex academic operations."
      description="Secondary schools manage more subjects, assessments, classes, teachers, and reporting needs. SchoolBase keeps those records connected so teams can work with greater clarity."
      proofTitle="Secondary school view"
      proofTiles={[
        "Subject records",
        "Assessment flow",
        "Results publishing",
        "Class visibility",
        "Teacher coordination",
        "Academic reports",
      ]}
      sectionTitle="Bring subject-rich school operations into one clearer system."
      ctaTitle="Give your secondary school a stronger academic operating foundation."
      features={[
        {
          icon: BookOpen,
          title: "Subject and class records",
          description:
            "Keep student, class, subject, and teacher information organized across the school.",
        },
        {
          icon: ClipboardList,
          title: "Assessment workflows",
          description:
            "Move from assessment entry to grading and reporting through a structured process.",
        },
        {
          icon: BarChart3,
          title: "Performance visibility",
          description:
            "Review class and subject patterns to support academic conversations and planning.",
        },
        {
          icon: Users,
          title: "Teacher coordination",
          description:
            "Give leaders and teachers clearer context around classes and academic responsibilities.",
        },
        {
          icon: BookOpen,
          title: "Results publishing",
          description:
            "Prepare and share results through a more dependable academic workflow.",
        },
        {
          icon: BarChart3,
          title: "Operational reporting",
          description:
            "Turn connected school records into useful summaries for school leadership.",
        },
      ]}
    />
  );
}

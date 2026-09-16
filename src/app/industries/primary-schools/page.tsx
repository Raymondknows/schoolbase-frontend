import type { Metadata } from "next";
import { BookOpen, CheckCircle2, Heart, Users } from "lucide-react";
import { PublicIndustryShell } from "@/components/public-industry-shell";
export const metadata: Metadata = {
  title: "Primary School Management Software | SchoolBase",
  description:
    "Connected school management workflows for primary schools, teachers, and parents.",
};
export default function PrimarySchoolsPage() {
  return (
    <PublicIndustryShell
      eyebrow="For primary schools"
      title="Clear, simple workflows for young learners and their families."
      description="SchoolBase helps primary schools keep academic records, attendance, fees, and parent communication organized without adding unnecessary complexity."
      proofTitle="Primary school view"
      proofTiles={[
        "Simple records",
        "Parent updates",
        "Attendance",
        "Fee visibility",
        "Progress reports",
        "Teacher workflow",
      ]}
      sectionTitle="Give teachers and parents the context they need."
      ctaTitle="Build a clearer foundation for your primary school."
      features={[
        {
          icon: Users,
          title: "Parent-focused updates",
          description:
            "Keep families closer to important attendance, academic, fee, and school updates.",
        },
        {
          icon: BookOpen,
          title: "Simple academic records",
          description:
            "Organize class and student progress information in a way teams can understand.",
        },
        {
          icon: Heart,
          title: "Daily visibility",
          description:
            "Keep attendance and everyday school activity visible to the people responsible for care and learning.",
        },
        {
          icon: CheckCircle2,
          title: "Clear fee workflows",
          description:
            "Give the school and families a more consistent view of what is due and what has been paid.",
        },
        {
          icon: Users,
          title: "Teacher collaboration",
          description:
            "Help teachers work from shared student and class information.",
        },
        {
          icon: BookOpen,
          title: "Progress reporting",
          description:
            "Turn academic records into clearer reports for school leaders and parents.",
        },
      ]}
    />
  );
}

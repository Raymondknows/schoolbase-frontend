import type { Metadata } from "next";
import { CalendarDays, Heart, MessageCircle, Users } from "lucide-react";
import { PublicIndustryShell } from "@/components/public-industry-shell";
export const metadata: Metadata = {
  title: "Early Childhood Center Management Software | SchoolBase",
  description:
    "Connected operational workflows for early childhood centers, teachers, and families.",
};
export default function EarlyChildhoodPage() {
  return (
    <PublicIndustryShell
      eyebrow="For early childhood centers"
      title="Keep the early years visible to the people who care for them."
      description="Early childhood teams need a clear view of attendance, classroom activity, family communication, and student records. SchoolBase brings the operational basics together."
      proofTitle="Early years view"
      proofTiles={[
        "Attendance",
        "Student records",
        "Family updates",
        "Class activity",
        "Fee visibility",
        "Staff coordination",
      ]}
      sectionTitle="Support the people caring for young learners."
      ctaTitle="Create a clearer daily operating rhythm for your center."
      features={[
        {
          icon: Heart,
          title: "Child-centered records",
          description:
            "Keep student information organized around the daily needs of young learners and their families.",
        },
        {
          icon: CalendarDays,
          title: "Attendance visibility",
          description:
            "Record daily attendance and keep the school team aware of who is present.",
        },
        {
          icon: MessageCircle,
          title: "Family communication",
          description:
            "Share important updates with parents through a consistent school communication flow.",
        },
        {
          icon: Users,
          title: "Teacher collaboration",
          description:
            "Give staff a shared view of classes, students, and the work that needs attention.",
        },
        {
          icon: Heart,
          title: "Progress context",
          description:
            "Keep useful observations and progress information connected to the student record.",
        },
        {
          icon: CalendarDays,
          title: "Operational clarity",
          description:
            "Reduce scattered notes and give leaders a clearer picture of everyday center activity.",
        },
      ]}
    />
  );
}

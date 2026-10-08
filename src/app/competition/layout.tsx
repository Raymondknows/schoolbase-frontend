import { redirect } from "next/navigation";
import SharedLayout from "@/components/shared-layout";
import { getStaffSession } from "@/lib/auth";

const studentNav = [
  { href: "/competition", label: "My Competition", icon: "Award", section: "Student Workspace" },
];

export default async function CompetitionLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  return (
    <SharedLayout
      navItems={studentNav}
      school={{ name: "Student Competition", city: "SchoolBase", country: "" }}
      session={session}
      logoHref="/competition"
      logoutRedirectUrl="/login"
    >
      {children}
    </SharedLayout>
  );
}
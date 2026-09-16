import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a SchoolBase Account",
  description: "Create a SchoolBase account for your school.",
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
import Link from "next/link";
import { Linkedin, Facebook, Mail, MessageCircle } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { getStaffSession, getParentSession } from "@/lib/auth";

export default async function Header() {
  const staff = await getStaffSession();
  const parent = await getParentSession();
  const isLoggedIn = Boolean(staff || parent);
  if (isLoggedIn) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        {/* Top bar with social links - hide for logged-in users */}
        {!isLoggedIn && (
          <div className="hidden md:flex justify-between items-center text-xs text-muted mb-2 pb-2 border-b border-border/30">
            <div>Built for West African schools by ClickBase Technologies Ltd.</div>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.linkedin.com/company/106371744/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-brand flex items-center gap-1"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
              <a
                href="https://web.facebook.com/profile.php?id=61577572757498"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-brand flex items-center gap-1"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </a>
              <a href="mailto:support@schoolbase.live" className="text-muted hover:text-brand flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email
              </a>
              <a
                href="https://wa.me/2349031368963"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-brand flex items-center gap-1"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Main header - shown only on public pages (no logged-in session) */}
        {!isLoggedIn && (
          <div className="flex items-center justify-between gap-4">
            <AppLogo />

            {/* Navigation */}
            <nav className="hidden items-center gap-5 text-sm font-medium text-muted md:flex">
              <Link href="/solutions/school-fee-management" className="hover:text-brand">
                Solutions
              </Link>
              <Link href="/compare/manual-systems" className="hover:text-brand">
                Compare
              </Link>
              <Link href="/for-principals" className="hover:text-brand">
                For Your Role
              </Link>
              <Link href="/guides/school-fee-management" className="hover:text-brand">
                Guides
              </Link>
              <Link href="/blog" className="hover:text-brand">
                Blog
              </Link>
              <a href="https://clickbasegroup.com/" target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                ClickBase
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2">
              <Link
                href="/signup"
                className="inline-flex px-5 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 text-sm"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

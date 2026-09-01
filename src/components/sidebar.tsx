"use client";

import { createElement, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/app-logo";
import { LogoutButton } from "@/components/logout-button";
import { resolveSchoolAssetUrl } from "@/lib/asset-urls";
import {
  Home,
  LayoutDashboard,
  BookOpen,
  BookMarked,
  FileText,
  ClipboardList,
  Users,
  Bell,
  Mail,
  UserCircle,
  CreditCard,
  GraduationCap,
  BarChart3,
  Settings,
  Globe,
  Layers,
  HelpCircle,
  Check,
  MessageSquare,
  PenTool,
  Building2,
  Baby,
  Eye,
  ClipboardCheck,
  TrendingUp,
  Award,
  Megaphone,
  Send,
  Sparkles,
  CalendarDays,
  CheckSquare,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  section?: string;
};

const icons: Record<string, ComponentType<{ className?: string }>> = {
  Home,
  LayoutDashboard,
  BookOpen,
  BookMarked,
  FileText,
  ClipboardList,
  Users,
  Bell,
  Mail,
  UserCircle,
  CreditCard,
  GraduationCap,
  WhatsApp: WhatsAppIcon,
  BarChart3,
  Settings,
  Globe,
  Layers,
  HelpCircle,
  MessageSquare,
  PenTool,
  Building2,
  Baby,
  Eye,
  ClipboardCheck,
  TrendingUp,
  Award,
  Megaphone,
  Send,
  Sparkles,
  CalendarDays,
  CheckSquare,
};

export default function Sidebar({
  navItems,
  school,
  session,
  logoHref = "/",
  logoutRedirectUrl = "/login",
  setupProgress,
  isMobile = false,
  onClose,
}: {
  navItems: NavItem[];
  school?: { name?: string | null; city?: string | null; country?: string | null; logoUrl?: string | null } | null;
  session?: { name?: string } | null;
  logoHref?: string;
  logoutRedirectUrl?: string;
  setupProgress?: number | null;
  isMobile?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const schoolLogo = school?.logoUrl ? resolveSchoolAssetUrl(school.logoUrl) : null;
  const schoolName = school?.name || "SchoolBase";
  const normalizedProgress = typeof setupProgress === "number" ? Math.max(0, Math.min(100, setupProgress)) : 0;
  const progressCircumference = 2 * Math.PI * 10;
  const navItemsWithSectionVisibility = navItems.map((item, index) => ({
    ...item,
    showSection: Boolean(item.section && (index === 0 || navItems[index - 1].section !== item.section)),
  }));

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside className={`w-56 h-screen flex flex-col border-r border-border bg-surface overflow-hidden print:hidden ${
      isMobile ? "" : "hidden md:flex"
    }`}>
      <div className="border-b border-border px-4 py-4 flex-shrink-0">
        <Link href={logoHref} className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-accent/40 transition-colors">
          {schoolLogo ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-white shadow-sm">
              <img src={schoolLogo} alt={schoolName} className="h-full w-full object-contain p-1" />
            </div>
          ) : (
            <AppLogo size="md" showText={false} href={null} />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{schoolName}</p>
            <p className="truncate text-xs text-muted">{session?.name ?? "Staff"} · {school?.city ?? school?.country}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 p-2 overflow-y-auto">
        {navItemsWithSectionVisibility.map(({ href, label, icon, section, showSection }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <div key={href}>
              {showSection ? (
                <div className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {section}
                </div>
              ) : null}
              <Link
                href={href}
                onClick={handleNavClick}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-muted hover:bg-brand-light hover:text-brand"
                }`}
              >
                {href === "/admin/getting-started" ? (
                  <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    <svg viewBox="0 0 24 24" className={`h-5 w-5 -rotate-90 ${isActive ? "text-brand" : "text-muted/70"}`}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.22" />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={progressCircumference}
                        strokeDashoffset={progressCircumference - (progressCircumference * normalizedProgress) / 100}
                      />
                    </svg>
                    {normalizedProgress >= 100 ? (
                      <Check className="absolute h-3.5 w-3.5 text-brand" />
                    ) : (
                      <Sparkles className="absolute h-3 w-3 text-brand" />
                    )}
                  </div>
                ) : icons[icon] ? createElement(icons[icon], { className: "h-4 w-4" }) : null}
                {label}
                {href === "/admin/timetable" ? (
                  <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    New
                  </span>
                ) : null}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border px-3 py-3 space-y-2 flex-shrink-0">
        <LogoutButton redirectUrl={logoutRedirectUrl} />
      </div>
    </aside>
  );
}

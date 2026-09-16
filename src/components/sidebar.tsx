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
  icon: string | ComponentType<{ className?: string }>;
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
  const portalName = logoHref.startsWith("/parent")
    ? "Parent portal"
    : logoHref.startsWith("/accounting")
      ? "Finance workspace"
      : logoHref.startsWith("/teacher")
        ? "Teacher workspace"
        : logoHref.startsWith("/schoolbase-admin")
          ? "Platform admin"
          : "School admin";
  const schoolContext = [session?.name ?? "Staff", school?.city ?? school?.country].filter(Boolean).join(" · ");
  const normalizedProgress = typeof setupProgress === "number" ? Math.max(0, Math.min(100, setupProgress)) : 0;
  const progressCircumference = 2 * Math.PI * 10;
  const navItemsWithSectionVisibility = navItems.map((item, index) => ({
    ...item,
    sectionLabel: item.section || (index === 0 ? portalName : undefined),
    showSection: Boolean((item.section || index === 0) && (index === 0 || navItems[index - 1].section !== item.section)),
  }));

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside className={`flex h-screen w-64 flex-col border-r border-border bg-surface overflow-hidden print:hidden ${
      isMobile ? "" : "hidden md:flex"
    }`}>
      <div className="border-b border-border px-4 py-4 flex-shrink-0">
        <Link href={logoHref} className="group flex items-center gap-3 px-1 py-1 transition-colors">
          {schoolLogo ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white shadow-sm">
              <img src={schoolLogo} alt={schoolName} className="h-full w-full object-contain p-1" />
            </div>
          ) : (
            <AppLogo size="md" showText={false} href={null} />
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-brand">{portalName}</p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground group-hover:text-brand">{schoolName}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted">{schoolContext || "Workspace"}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItemsWithSectionVisibility.map(({ href, label, icon, sectionLabel, showSection }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const IconComponent = typeof icon === "string" ? icons[icon] : icon;

          return (
            <div key={href}>
              {showSection ? (
                <div className="px-2 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[.18em] text-muted first:pt-0">
                  {sectionLabel}
                </div>
              ) : null}
              <Link
                href={href}
                onClick={handleNavClick}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex cursor-pointer items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-brand bg-brand-light font-semibold text-brand"
                    : "border-transparent text-muted hover:border-brand/30 hover:bg-brand-light hover:text-brand"
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
                ) : IconComponent ? createElement(IconComponent, { className: "h-4 w-4" }) : null}
                <span className="min-w-0 flex-1 truncate">{label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border bg-background px-3 py-3 flex-shrink-0">
        <div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[.16em] text-muted">
          <span className="h-1.5 w-1.5 bg-emerald-500" />
          {portalName}
        </div>
        <LogoutButton redirectUrl={logoutRedirectUrl} />
      </div>
    </aside>
  );
}

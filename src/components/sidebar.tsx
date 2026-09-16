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
  MoonStar,
  SunMedium,
  Calculator,
  Clock,
  Music,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";

type NavItem = {
  href: string;
  label: string;
  icon: string | ComponentType<{ className?: string }>;
  section?: string;
};

type WorkspaceTool = "notes" | "calculator" | "reminders" | "timer";

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
  actualTheme = "light",
  onThemeToggle,
  toolsOpen = false,
  onToolsToggle,
  onToolSelect,
  onAudioOpen,
  isMobile = false,
  onClose,
}: {
  navItems: NavItem[];
  school?: { name?: string | null; city?: string | null; country?: string | null; logoUrl?: string | null } | null;
  session?: { name?: string } | null;
  logoHref?: string;
  logoutRedirectUrl?: string;
  setupProgress?: number | null;
  actualTheme?: "light" | "dark";
  onThemeToggle?: () => void;
  toolsOpen?: boolean;
  onToolsToggle?: () => void;
  onToolSelect?: (tool: WorkspaceTool) => void;
  onAudioOpen?: () => void;
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
    sectionLabel: item.section,
    showSection: Boolean(item.section && (index === 0 || navItems[index - 1].section !== item.section)),
  }));

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside className={`relative flex h-screen w-64 flex-col border-r border-border bg-surface overflow-hidden print:hidden ${
      isMobile ? "" : "hidden md:flex"
    }`}>
      {onThemeToggle ? (
        <button
          type="button"
          onClick={onThemeToggle}
          title={actualTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={actualTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="absolute right-0 top-1/2 z-20 flex h-14 w-6 -translate-y-1/2 items-center justify-center border border-r-0 border-brand bg-brand text-white shadow-sm transition hover:bg-brand-hover"
        >
          {actualTheme === "dark" ? <SunMedium className="h-3.5 w-3.5" /> : <MoonStar className="h-3.5 w-3.5" />}
        </button>
      ) : null}
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

      <div className="relative border-t border-border bg-background px-3 py-3 flex-shrink-0">
        {onToolsToggle ? (
          <div className="relative mb-2">
            {toolsOpen ? (
              <div className="absolute bottom-full left-0 right-0 mb-2 grid grid-cols-5 gap-1 rounded-lg border border-border bg-surface p-2 shadow-lg">
                {[
                  ["notes", FileText, "Notes"],
                  ["calculator", Calculator, "Calculator"],
                  ["reminders", Bell, "Reminders"],
                  ["timer", Clock, "Timer"],
                  ["audio", Music, "Audio player"],
                ].map(([tool, Icon, label]) => (
                  <button
                    key={tool as string}
                    type="button"
                    onClick={() => tool === "audio" ? onAudioOpen?.() : onToolSelect?.(tool as WorkspaceTool)}
                    title={label as string}
                    aria-label={label as string}
                    className="flex h-9 items-center justify-center rounded-md text-muted transition hover:bg-brand-light hover:text-brand"
                  >
                    {createElement(Icon as ComponentType<{ className?: string }>, { className: "h-4 w-4" })}
                  </button>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              onClick={onToolsToggle}
              aria-expanded={toolsOpen}
              className="flex w-full items-center gap-3 border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-muted transition hover:border-brand/40 hover:bg-brand-light hover:text-brand"
            >
              <Sparkles className="h-4 w-4" />
              <span>Tools</span>
            </button>
          </div>
        ) : null}
        <LogoutButton redirectUrl={logoutRedirectUrl} />
      </div>
    </aside>
  );
}

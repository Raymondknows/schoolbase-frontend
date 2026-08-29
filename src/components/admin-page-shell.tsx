"use client";

import { ReactNode } from "react";
import Link from "next/link";

export default function AdminPageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-2xl border border-border/80 bg-surface/80 px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)] backdrop-blur-sm sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">SchoolBase admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle ? <p className="mt-1 max-w-3xl text-sm text-muted">{subtitle}</p> : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-3">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

"use client";

import { type ButtonHTMLAttributes } from "react";

type Variant = "default" | "primary" | "secondary" | "ghost" | "outline" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  href?: string;
}

const variants: Record<Variant, string> = {
  default:
    "bg-background text-foreground border border-border hover:bg-surface",
  primary:
    "bg-brand text-white hover:bg-brand-hover shadow-sm",
  secondary:
    "bg-white text-brand border border-brand hover:bg-brand-light",
  ghost: "bg-transparent text-brand hover:bg-brand-light",
  outline: "bg-transparent text-brand border border-border hover:bg-brand-light",
  destructive: "bg-error text-white hover:bg-error-dark shadow-sm",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  href,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

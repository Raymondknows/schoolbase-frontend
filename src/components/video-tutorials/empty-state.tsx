import Link from "next/link";
import { PlayCircle } from "lucide-react";

interface EmptyStateProps {
  category?: string;
  onReset?: () => void;
}

export function EmptyState({ category, onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center border border-border bg-white px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center bg-brand-light text-brand">
        <PlayCircle className="h-7 w-7" />
      </div>

      <h3 className="mt-6 text-2xl font-bold text-foreground">
        {category && category !== "all"
          ? `No tutorials in ${category}`
          : "No tutorials available"}
      </h3>

      <p className="mb-8 mt-3 max-w-sm leading-7 text-muted">
        {category && category !== "all"
          ? "Check back later for new content in this category."
          : "We're working on creating comprehensive video tutorials for you."}
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {category && category !== "all" && (
          <button
            onClick={onReset}
            className="rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
          >
            Browse All Categories
          </button>
        )}
        <Link
          href="/"
          className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

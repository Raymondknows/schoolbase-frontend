import { BookOpen, Play, Search } from "lucide-react";

interface VideoHeroSectionProps {
  videoCount?: number;
  onSearchChange?: (query: string) => void;
}

export function VideoHeroSection({ videoCount = 0, onSearchChange }: VideoHeroSectionProps) {
  return (
    <section className="border-b border-border bg-[#f6faff]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:py-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div>
          <div className="flex h-11 w-11 items-center justify-center bg-brand-light text-brand">
            <Play className="h-5 w-5 fill-current" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-brand">SchoolBase learning centre</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            Learn SchoolBase step by step.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Master every feature with practical walkthroughs for setup, daily operations, and advanced configurations.
          </p>
        </div>

        <div>
          <label htmlFor="tutorial-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Find a tutorial</label>
          <div className="relative">
            <input
              id="tutorial-search"
              type="text"
              placeholder="Search setup, fees, results..."
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full border border-border bg-white px-5 py-3.5 pr-12 text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand">
              <Search className="h-5 w-5" />
            </div>
          </div>
          {videoCount > 0 && (
            <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted">
              <BookOpen className="h-4 w-4 text-brand" />
              <span>{videoCount} tutorials available in the library</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

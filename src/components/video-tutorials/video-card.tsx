import Link from "next/link";
import { ArrowRight, Clock, Play } from "lucide-react";

interface VideoCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  featured?: boolean;
  createdAt?: string;
  duration?: string;
}

export function VideoCard({
  id,
  title,
  description,
  category,
  featured = false,
  duration,
}: VideoCardProps) {
  const cardClasses = featured
    ? "md:col-span-2 md:row-span-2"
    : "";

  return (
    <Link href={`/video-tutorials/${id}`} className={`group block border border-border bg-white p-6 transition hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg ${cardClasses}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center bg-brand-light text-brand">
          <Play className="h-5 w-5 fill-current" />
        </div>
        <ArrowRight className="h-5 w-5 text-muted transition group-hover:translate-x-1 group-hover:text-brand" />
      </div>
      <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-brand">{category}</p>
      <h3 className="mt-2 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-3 line-clamp-3 leading-7 text-muted">{description}</p>
      {duration && (
        <p className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted">
          <Clock className="h-4 w-4 text-brand" /> {duration}
        </p>
      )}
    </Link>
  );
}

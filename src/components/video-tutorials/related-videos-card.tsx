import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";

interface RelatedVideo {
  id: string;
  title: string;
  category: string;
  duration?: string;
}

interface RelatedVideosCardProps {
  videos: RelatedVideo[];
  category?: string;
}

export function RelatedVideosCard({ videos, category }: RelatedVideosCardProps) {
  return (
    <div className="sticky top-20 border border-border bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Continue learning</p>
      <h3 className="mt-3 text-xl font-semibold text-foreground">
        {category ? `More ${category} Videos` : "Related Videos"}
      </h3>

      <div className="space-y-3">
        {videos.slice(0, 5).map((video) => (
          <Link
            key={video.id}
            href={`/video-tutorials/${video.id}`}
            className="group flex items-start gap-3 border-t border-border px-0 py-4 transition-colors first:border-t-0 hover:text-brand"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-brand-light text-brand">
              <Play className="h-5 w-5 fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-brand">
                {video.title}
              </p>
              {video.duration && (
                <p className="mt-1 text-xs text-muted">{video.duration}</p>
              )}
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-brand" />
          </Link>
        ))}
      </div>

      {videos.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">
          No related videos yet
        </p>
      )}
    </div>
  );
}

"use client";

import { Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

interface VideoTutorialDetailsClientProps {
  video: {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    category: string;
  };
}

export default function VideoTutorialDetailsClient({ video }: VideoTutorialDetailsClientProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setShareUrl(window.location.href);
    setCanShare(typeof navigator.share === "function");
  }, []);

  const handleCopy = () => {
    if (typeof window === "undefined") return;

    const urlToCopy = shareUrl || window.location.href;
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (typeof window === "undefined" || !canShare) return;

    try {
      await navigator.share({
        title: video.title,
        text: video.description,
        url: shareUrl || window.location.href,
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Share Section */}
      <div className="border border-border bg-white p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Share2 className="h-5 w-5 text-brand" />
          Share this tutorial
        </h3>
        
        <div className="space-y-3">
          {/* Share Link */}
          <div className="flex gap-2">
            <div className="flex-1 truncate border border-border bg-background px-4 py-3 font-mono text-xs text-muted">
              {shareUrl || "Loading link..."}
            </div>
            <button
              onClick={handleCopy}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "border border-border bg-white text-foreground hover:border-brand hover:text-brand"
              }`}
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {canShare && (
            <button
              onClick={handleShare}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              <Share2 className="h-4 w-4" />
              Share Tutorial
            </button>
          )}
        </div>
      </div>

      {/* Meta Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-border bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Category
          </p>
          <p className="text-base font-semibold text-foreground">
            {video.category}
          </p>
        </div>
        <div className="border border-border bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Type
          </p>
          <p className="text-base font-semibold text-foreground">
            Video Tutorial
          </p>
        </div>
      </div>
    </div>
  );
}

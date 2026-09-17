import { notFound } from "next/navigation";
import VideoTutorialDetailsClient from "./video-tutorial-details-client";
import VideoPlayerClient from "./video-player-client";
import { getBackendUrl } from "@/lib/backend-url";
import { getEmbedUrl } from "@/lib/video-embed-url";
import { VideoBreadcrumb } from "@/components/video-tutorials/video-breadcrumb";
import { RelatedVideosCard } from "@/components/video-tutorials/related-videos-card";
import { Calendar, Tag } from "lucide-react";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<any> {
  const params = await props.params;
  const backendUrl = getBackendUrl();

  try {
    const endpoints = [
      `${backendUrl}/api/videos/${params.id}`,
      `${backendUrl}/schoolbase-admin/api/videos/${params.id}`,
      `${backendUrl}/api/admin/videos/${params.id}`,
    ];

    let video: any = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        video = data.video;
        if (video) {
          break;
        }
      } catch {
        // Try the next fallback endpoint.
      }
    }

    if (!video) {
      return {
        title: "Video Not Found | SchoolBase",
        description: "The video tutorial you're looking for doesn't exist.",
      };
    }

    return {
      title: `${video.title} | SchoolBase`,
      description: video.description || "Watch SchoolBase video tutorials",
    };
  } catch {
    return {
      title: "Video Tutorial | SchoolBase",
      description: "Watch SchoolBase video tutorials",
    };
  }
}

export default async function VideoTutorialPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const backendUrl = getBackendUrl();

  try {
    const videoEndpoints = [
      `${backendUrl}/api/videos/${params.id}`,
      `${backendUrl}/schoolbase-admin/api/videos/${params.id}`,
      `${backendUrl}/api/admin/videos/${params.id}`,
    ];

    let video: any = null;

    for (const endpoint of videoEndpoints) {
      try {
        const response = await fetch(endpoint, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        video = data.video;
        if (video) {
          break;
        }
      } catch {
        // Try the next fallback endpoint.
      }
    }

    if (!video) {
      notFound();
    }

    let relatedVideos = [];
    try {
      const relatedEndpoints = [
        `${backendUrl}/api/videos`,
        `${backendUrl}/schoolbase-admin/api/videos`,
        `${backendUrl}/api/admin/videos`,
      ];

      for (const endpoint of relatedEndpoints) {
        try {
          const allVideosResponse = await fetch(endpoint, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          });

          if (!allVideosResponse.ok) {
            continue;
          }

          const allData = await allVideosResponse.json();
          relatedVideos = (allData.videos || [])
            .filter((v: any) => v.category === video.category && v.id !== video.id)
            .slice(0, 5);
          break;
        } catch (err) {
          console.error('Error fetching related videos:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching related videos:', err);
    }

    const formattedDate = video.createdAt 
      ? new Date(video.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : null;

    return (
      <div className="min-h-screen overflow-hidden bg-background">
        {/* Header Background */}
        <div className="border-b border-border bg-[#f6faff]">
          <div className="mx-auto max-w-6xl px-6 pt-8 pb-1">
            <VideoBreadcrumb
              items={[
                { label: "Video Tutorials", href: "/video-tutorials" },
                { label: video.category, href: `/video-tutorials?category=${video.category}` },
                { label: video.title },
              ]}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,.8fr)]">
            {/* Main Column */}
            <div className="space-y-10">
              {/* Video Player */}
              <div className="overflow-hidden border border-border bg-white shadow-lg">
                <div>
                  <VideoPlayerClient
                    videoUrl={video.videoUrl}
                    title={video.title}
                    embedUrl={getEmbedUrl(video.videoUrl)}
                  />
                </div>
              </div>

              {/* Video Info */}
              <div className="space-y-6">
                {/* Title and Category */}
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Video tutorial</p>
                  <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
                    {video.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 border border-brand/20 bg-brand-light px-3 py-2 text-sm font-semibold text-brand">
                      <Tag className="h-4 w-4" />
                      {video.category}
                    </span>
                    {formattedDate && (
                      <span className="inline-flex items-center gap-2 border border-border bg-white px-3 py-2 text-sm text-muted">
                        <Calendar className="h-4 w-4" />
                        {formattedDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="border border-border bg-white p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">About this tutorial</p>
                  <p className="mt-4 leading-8 text-muted">
                    {video.description}
                  </p>
                </div>

                {/* Interaction Component */}
                <VideoTutorialDetailsClient video={video} />
              </div>
            </div>

            {/* Sidebar */}
            <div>
              {relatedVideos.length > 0 && (
                <RelatedVideosCard 
                  videos={relatedVideos}
                  category={video.category}
                />
              )}

              {/* Call to Action Box */}
              <div className="mt-6 border border-brand/20 bg-[#f6faff] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Put it into practice</p>
                <h3 className="mt-3 text-xl font-semibold text-foreground">
                  Ready to use SchoolBase?
                </h3>
                <p className="mb-5 mt-3 text-sm leading-7 text-muted">
                  Start using SchoolBase now and give your school the controls it needs.
                </p>
                <a
                  href="/signup"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading video:', error);
    notFound();
  }
}

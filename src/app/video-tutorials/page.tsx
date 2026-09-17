"use client";

import { useState, useEffect } from "react";
import { getBackendUrl } from "@/lib/backend-url";
import { VideoHeroSection } from "@/components/video-tutorials/video-hero-section";
import { CategoryFilterBar } from "@/components/video-tutorials/category-filter-bar";
import { VideoCard } from "@/components/video-tutorials/video-card";
import { LoadingSkeletonGrid } from "@/components/video-tutorials/loading-skeleton-grid";
import { EmptyState } from "@/components/video-tutorials/empty-state";

interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  category: string;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  duration?: string;
}

export default function VideoTutorialsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function loadVideos() {
      try {
        const backendUrl = getBackendUrl();
        const endpoints = [
          `${backendUrl}/api/videos`,
          `${backendUrl}/schoolbase-admin/api/videos`,
          `${backendUrl}/api/admin/videos`,
        ];

        let loadedVideos: Video[] = [];

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
              continue;
            }

            const data = await response.json();
            loadedVideos = Array.isArray(data?.videos) ? data.videos : [];
            break;
          } catch (err) {
            console.warn(`Unable to load videos from ${endpoint}:`, err);
          }
        }

        setVideos(loadedVideos);
      } catch (err) {
        console.error('Error loading videos:', err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    }

    loadVideos();
  }, []);

  // Get unique categories
  const categories = ['all', ...new Set(videos.map(v => v.category))];
  
  // Filter videos by category and search
  const filteredVideos = videos.filter(v => {
    const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory;
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Separate featured videos
  const featuredVideos = filteredVideos.filter(v => v.featured);
  const regularVideos = filteredVideos.filter(v => !v.featured);

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      {/* Hero Section */}
      <VideoHeroSection 
        videoCount={videos.length}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        {/* Category Filter */}
        <div className="mb-12 border-b border-border pb-8">
          <CategoryFilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {loading ? (
          <LoadingSkeletonGrid itemCount={6} />
        ) : filteredVideos.length === 0 ? (
          <EmptyState 
            category={selectedCategory}
            onReset={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
          />
        ) : (
          <div className="space-y-16">
            {/* Featured Section */}
            {featuredVideos.length > 0 && (
              <div>
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Start here</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Featured tutorials</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {featuredVideos.map(video => (
                    <VideoCard
                      key={video.id}
                      id={video.id}
                      title={video.title}
                      description={video.description}
                      category={video.category}
                      featured={true}
                      duration={video.duration}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Videos Grid */}
            {regularVideos.length > 0 && (
              <div>
                {featuredVideos.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Browse the library</p>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">All tutorials</h2>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {regularVideos.map(video => (
                    <VideoCard
                      key={video.id}
                      id={video.id}
                      title={video.title}
                      description={video.description}
                      category={video.category}
                      duration={video.duration}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

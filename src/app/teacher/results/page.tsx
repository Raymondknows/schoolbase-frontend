"use client";

import { useSearchParams } from 'next/navigation';
import TeacherResultsEnhancedClient from "./results-client";
import { useAssessmentData } from "@/lib/hooks/useAssessmentData";
import SubscriptionModal from "@/components/subscription-modal";

export default function ResultsPage() {
  const { data, loading, error, subscriptionBlocked } = useAssessmentData({
    endpoint: "/api/teacher/assessments",
  });
  const searchParams = useSearchParams();
  const initialSubject = searchParams?.get('subject') ?? undefined;

  const assessments = data?.assessments || [];
  const sessions = data?.sessions || [];
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted">Loading results...</p>
      </div>
    );
  }

  if (subscriptionBlocked) {
    return <SubscriptionModal reason={subscriptionBlocked.reason} />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Error: {error}</p>
      </div>
    );
  }

  return <TeacherResultsEnhancedClient assessments={assessments} sessions={sessions} initialSubject={initialSubject} />;
}

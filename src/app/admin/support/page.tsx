"use client";

import { useEffect, useState } from "react";
import { getBackendUrl } from "@/lib/backend-url";
import { UserGuide, type PageHelpGuide } from "@/components/ui/user-guide";
import SupportRequestsClient from "./support-client";
import AdminSkeleton from "@/components/ui/skeleton";
import SubscriptionModal from "@/components/subscription-modal";

const HELP_GUIDE: PageHelpGuide = {
  title: "Managing Support Requests",
  overview: "View and respond to support requests from your school staff and community. Track request status and provide timely assistance.",
  steps: [
    "Review incoming support requests from your staff and parents.",
    "Read the full message and context for each request.",
    "Respond to requests to resolve issues or provide guidance.",
    "Update request status as you work on them.",
    "Mark requests as resolved once completed.",
  ],
  commonTasks: [
    {
      title: "View a Support Request",
      description: "Open and read detailed support request information.",
      tips: [
        "Click on any request in the list to view full details",
        "See the complete message thread and history",
        "Check the priority level and current status",
        "View sender information and contact details",
      ],
    },
    {
      title: "Respond to a Request",
      description: "Send a reply to help resolve the support request.",
      tips: [
        "Open the request you want to respond to",
        "Click 'Add response' or the message input area",
        "Type your reply with helpful information or next steps",
        "Send the response to notify the requester",
      ],
    },
    {
      title: "Update Request Status",
      description: "Change the status to track progress.",
      tips: [
        "Use status options: Open, In Progress, Resolved",
        "Update to 'In Progress' when you start working on it",
        "Mark as 'Resolved' when the issue is fixed",
      ],
    },
  ],
  faqs: [
    {
      question: "How do I know when a new request comes in?",
      answer: "New support requests appear at the top of your list. The number of unread requests is shown in your navigation menu.",
    },
    {
      question: "Can I prioritize certain requests?",
      answer: "Requests are marked with priority levels (Low, Medium, High, Urgent). Filter by priority to focus on urgent items first.",
    },
    {
      question: "What should I do if I can't resolve a request?",
      answer: "You can add a note explaining the situation or contact the SchoolBase support team (support@schoolbase.live) to escalate complex issues.",
    },
  ],
};

export type AdminSupportRequestRow = {
  id: string;
  subject: string;
  message: string;
  response?: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    senderRole: string;
    senderName: string;
    senderEmail?: string | null;
    body: string;
    createdAt: string;
  }>;
  school: {
    id: string;
    name: string;
    country: string;
  } | null;
};

export default function SupportPage() {
  const [requests, setRequests] = useState<AdminSupportRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<{
    reason?: string;
    schoolName?: string;
  } | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/admin/support/data`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 403) {
          const data = await response.json();
          if (data?.code === 'SUBSCRIPTION_INACTIVE') {
            setSubscriptionError({
              reason: data.reason || 'Your school subscription is not active.',
              schoolName: data.school?.name,
            });
          }
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setRequests(data.supportRequests || []);
        }
      } catch (error) {
        console.error('Failed to fetch support requests:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSkeleton />
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <>
        <div className="space-y-8">
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <p className="text-muted">Support requests are not available.</p>
          </div>
        </div>
        <SubscriptionModal reason={subscriptionError.reason} schoolName={subscriptionError.schoolName} />
      </>
    );
  }

  return (
    <main className="min-h-screen pb-12">
    <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
      <SupportRequestsClient initialRequests={requests} />

      {/* Help & Guide */}
      <UserGuide guide={HELP_GUIDE} />
    </div>
    </main>
  );
}

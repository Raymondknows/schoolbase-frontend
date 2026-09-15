"use client";

import { getBackendUrl } from "@/lib/backend-url";
import { useEffect, useState } from "react";
import TeachersPageClient from "../teachers/teachers-client";
import AdminSkeleton from "@/components/ui/skeleton";
import SubscriptionModal from "@/components/subscription-modal";

export default function AdminStaffPage() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<{ reason: string; schoolName?: string } | null>(null);
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const backendUrl = getBackendUrl();
        const [response, verifyResponse] = await Promise.all([
          fetch(`${backendUrl}/api/admin/teachers/data`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch(`${backendUrl}/api/admin/verify`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }),
        ]);

        let schoolNameToUse = "";
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json().catch(() => null);
          if (verifyData?.authenticated && verifyData.session?.schoolId) {
            try {
              const schoolResponse = await fetch(`${backendUrl}/api/admin/school/${verifyData.session.schoolId}`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
              });
              if (schoolResponse.ok) {
                const schoolData = await schoolResponse.json().catch(() => null);
                schoolNameToUse = schoolData?.name || "";
              }
            } catch (err) {
              console.error("Error fetching school name:", err);
            }
          }
        }

        if (!response.ok) {
          if (response.status === 403) {
            const errorBody = await response.json().catch(() => null);
            if (errorBody?.code === 'SUBSCRIPTION_INACTIVE') {
              setSubscriptionBlocked({
                reason: errorBody.reason || 'Your school subscription is not active',
                schoolName: schoolNameToUse || undefined,
              });
              setSchoolName(schoolNameToUse);
              setLoading(false);
              return;
            }
          }
          throw new Error(`Failed to fetch staff data: ${response.status}`);
        }
        const data = await response.json();
        setSchoolName(schoolNameToUse);
        setClasses(data.classes || []);
        setSubjects(data.subjects || []);
        setTeachers(data.teachers || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching staff data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSkeleton />
      </div>
    );
  }

  if (subscriptionBlocked) {
    return <SubscriptionModal reason={subscriptionBlocked.reason} schoolName={subscriptionBlocked.schoolName || schoolName || 'Your School'} />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
        <div className="border border-error/20 bg-error/10 p-4">
          <p className="text-sm text-error">Error: {error}</p>
        </div>
      </div>
    );
  }

  return <TeachersPageClient classes={classes} subjects={subjects} teachers={teachers} />;
}

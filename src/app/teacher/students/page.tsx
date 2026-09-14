'use client';

import { useEffect, useState } from 'react';
import { getBackendUrl } from '@/lib/backend-url';
import StudentsPageClient from './students-client';
import AdminSkeleton from '@/components/ui/skeleton';

export default function StudentsPage() {
  const [pupils, setPupils] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const backendUrl = getBackendUrl();
        
        // Load teacher's classes
        const classesRes = await fetch(`${backendUrl}/api/teacher/classes`, {
          credentials: 'include',
        });
        if (!classesRes.ok) throw new Error('Failed to load classes');
        const classesData = await classesRes.json();
        // Load all students from all assigned classes
        if (classesData.classes && classesData.classes.length > 0) {
          const allStudents: any[] = [];
          for (const classItem of classesData.classes) {
            try {
              const studentsRes = await fetch(`${backendUrl}/api/teacher/classes/${classItem.id}/students`, {
                credentials: 'include',
              });
              if (studentsRes.ok) {
                const studentsData = await studentsRes.json();
                allStudents.push(...(studentsData.students || []));
              }
            } catch (err) {
              console.error(`Failed to load students for class ${classItem.id}:`, err);
            }
          }
          setPupils(allStudents);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <AdminSkeleton />;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <StudentsPageClient pupils={pupils} />
  );
}

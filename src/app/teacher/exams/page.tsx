'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ClipboardCheck, Plus } from 'lucide-react';
import { getBackendUrl } from '@/lib/backend-url';
import AdminSkeleton from '@/components/ui/skeleton';
import TeacherPageHeader from '@/components/teacher-page-header';

interface Class {
  id: string;
  name: string;
}

interface Exam {
  id: string;
  title: string;
  date: string;
  totalMarks: number;
}

export default function ExamsPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClasses() {
      try {
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/api/teacher/classes`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load classes');
        const data = await res.json();
        setClasses(data.classes);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, []);

  if (loading) {
    return <AdminSkeleton />;
  }

  return (
    <div className="space-y-6">
      <TeacherPageHeader icon={ClipboardCheck} title="Exams" description="Create and manage exams for your assigned classes." count={`${exams.length} exams`} />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Select Class */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <label className="block text-sm font-medium text-foreground mb-2">Select Class</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-foreground focus:ring-2 focus:ring-brand focus:border-transparent bg-surface"
        >
          <option value="">Choose a class...</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create Exam Button */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <button className="w-full px-6 py-3 text-white rounded-lg font-medium flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 transition-colors">
          <Plus className="h-5 w-5" />
          Create New Exam
        </button>
      </div>

      {/* Exams List */}
      {exams.length > 0 ? (
        <div className="bg-surface rounded-lg border border-border overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-background">
            <h2 className="font-semibold text-foreground">Exams</h2>
          </div>

          <div className="divide-y divide-border">
            {exams.map((exam) => (
              <div key={exam.id} className="px-6 py-4 hover:bg-background transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{exam.title}</p>
                    <p className="text-sm text-muted">{exam.totalMarks} marks</p>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(exam.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-background rounded-lg border border-border p-8 text-center">
          <ClipboardCheck className="h-12 w-12 text-muted/50 mx-auto mb-3" />
          <p className="text-muted">No exams yet</p>
        </div>
      )}
    </div>
  );
}

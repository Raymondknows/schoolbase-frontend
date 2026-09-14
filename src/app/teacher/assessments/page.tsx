'use client';

import { getBackendUrl } from '@/lib/backend-url';
import { useState, useEffect } from 'react';
import { AlertCircle, Plus, Loader2 } from 'lucide-react';
import AdminSkeleton from '@/components/ui/skeleton';

interface Class {
  id: string;
  name: string;
}

interface Assessment {
  id: string;
  title: string;
  type: string;
  totalScore: number;
  createdAt: string;
}

export default function AssessmentsPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'CLASS_TEST',
    totalScore: 100,
  });

  // Load classes
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

  // Load assessments when class changes
  useEffect(() => {
    if (!selectedClass) {
      setAssessments([]);
      return;
    }

    async function loadAssessments() {
      try {
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/api/teacher/assessments/${selectedClass}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load assessments');
        const data = await res.json();
        setAssessments(data.assessments || []);
      } catch (err: any) {
        setError(err.message);
      }
    }

    loadAssessments();
  }, [selectedClass]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/teacher/assessments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          ...formData,
        }),
      });

      if (!res.ok) throw new Error('Failed to create assessment');

      const data = await res.json();
      setAssessments([data.assessment, ...assessments]);
      setFormData({ title: '', type: 'CLASS_TEST', totalScore: 100 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <AdminSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assessments</h1>
        <p className="mt-1 text-muted">Create and manage class assessments</p>
      </div>

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

      {/* Create Assessment Form */}
      {selectedClass && (
        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Create New Assessment</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-foreground focus:ring-2 focus:ring-brand focus:border-transparent bg-surface"
                placeholder="e.g., Class Test 1"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground focus:ring-2 focus:ring-brand focus:border-transparent bg-surface"
                >
                  <option value="CLASS_TEST">Class Test</option>
                  <option value="ASSIGNMENT">Assignment</option>
                  <option value="PROJECT">Project</option>
                  <option value="EXAM">Exam</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Total Score</label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalScore}
                  onChange={(e) => setFormData({ ...formData, totalScore: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground focus:ring-2 focus:ring-brand focus:border-transparent bg-surface"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full px-6 py-2 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 transition-colors"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Assessment
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Assessments List */}
      {assessments.length > 0 && (
        <div className="bg-surface rounded-lg border border-border overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-background">
            <h2 className="font-semibold text-foreground">
              {assessments.length} Assessment{assessments.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="divide-y divide-border">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="px-6 py-4 hover:bg-background transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{assessment.title}</p>
                    <p className="text-sm text-muted">
                      {assessment.type} • {assessment.totalScore} points
                    </p>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(assessment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedClass && assessments.length === 0 && (
        <div className="bg-background rounded-lg border border-border p-8 text-center">
          <p className="text-muted">No assessments yet. Create one above.</p>
        </div>
      )}
    </div>
  );
}

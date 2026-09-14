'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminSkeleton from '@/components/ui/skeleton';

interface IncomeExpenseReport {
  incomeByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
  totalIncome: number;
  totalExpenses: number;
  netPosition: number;
}

export default function ReportsPage() {
  const [report, setReport] = useState<IncomeExpenseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [dateRange, setDateRange] = useState({
    startDate: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().split('T')[0];
    })(),
    endDate: new Date().toISOString().split('T')[0],
  });

  async function loadReport() {
    try {
      setError(null);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await fetch(
        `/api/bursar/reports/income-expense?${params}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to load report');
      }

      const result = await response.json();
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Report load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSkeleton />
      </div>
    );
  }

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setRefreshing(true);
    loadReport();
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <FileText size={17} /> Accounting
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Financial Reports</h1>
          <p className="mt-1 text-sm text-muted">
            Review school income, expense trends, and net position by period
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <div className="mb-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Report Period</h2>

        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                disabled={refreshing}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                disabled={refreshing}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={refreshing} className="inline-flex items-center gap-2">
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {report && (
        <>
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="border border-border bg-surface p-5 transition-colors hover:bg-brand-light/40">
              <div className="mb-4 flex items-center gap-2 text-brand">
                <TrendingUp className="h-4 w-4 text-brand" />
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Total Income</span>
              </div>
              <div className="text-3xl font-semibold text-green-600">+{formatAmount(report.totalIncome)}</div>
              <div className="mt-1 text-xs text-muted">Inflows recorded</div>
            </div>

            <div className="border border-border bg-surface p-5 transition-colors hover:bg-brand-light/40">
              <div className="mb-4 flex items-center gap-2 text-brand">
                <TrendingDown className="h-4 w-4 text-brand" />
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Total Expenses</span>
              </div>
              <div className="text-3xl font-semibold text-red-600">-{formatAmount(report.totalExpenses)}</div>
              <div className="mt-1 text-xs text-muted">Costs and payouts</div>
            </div>

            <div className="border border-border bg-surface p-5 transition-colors hover:bg-brand-light/40">
              <div className="mb-4 flex items-center gap-2 text-brand">
                <FileText className="h-4 w-4 text-brand" />
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Net Position</span>
              </div>
              <div className={`text-3xl font-semibold ${report.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {report.netPosition >= 0 ? '+' : '-'}{formatAmount(Math.abs(report.netPosition))}
              </div>
              <div className="mt-1 text-xs text-muted">Income less expenses</div>
            </div>
          </div>

          {Object.keys(report.incomeByCategory).length > 0 && (
            <div className="mb-8 rounded-lg border border-border bg-surface p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Income by Category</h2>

              <div className="space-y-3">
                {Object.entries(report.incomeByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                    <span className="text-sm text-foreground">{category}</span>
                    <span className="font-medium text-green-600">+{formatAmount(amount)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-semibold">
                <span className="text-foreground">Total Income</span>
                <span className="text-green-600">+{formatAmount(report.totalIncome)}</span>
              </div>
            </div>
          )}

          {Object.keys(report.expenseByCategory).length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Expenses by Category</h2>

              <div className="space-y-3">
                {Object.entries(report.expenseByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                    <span className="text-sm text-foreground">{category}</span>
                    <span className="font-medium text-red-600">-{formatAmount(amount)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-semibold">
                <span className="text-foreground">Total Expenses</span>
                <span className="text-red-600">-{formatAmount(report.totalExpenses)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

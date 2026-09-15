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
    <main className="min-h-screen pb-12">
    <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
      <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div className="mb-0 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand">
            <FileText size={17} /> Accounting
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Financial reports</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Review income, expense trends, and net position across a reporting period.
          </p>
        </div>
      </div>
      </div>
      </header>

      {error && (
        <div className="mb-6 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <section className="border border-border bg-surface p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Reporting workspace</p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">Report period</h2>

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
      </section>

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
            <section className="mb-8 border border-border bg-surface p-5 sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Inflow detail</p><h2 className="mt-1 mb-4 text-lg font-semibold text-foreground">Income by category</h2>

              <div className="space-y-3">
                {Object.entries(report.incomeByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between border border-border bg-background px-3 py-2.5">
                    <span className="text-sm text-foreground">{category}</span>
                    <span className="font-medium text-green-600">+{formatAmount(amount)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-semibold">
                <span className="text-foreground">Total Income</span>
                <span className="text-green-600">+{formatAmount(report.totalIncome)}</span>
              </div>
            </section>
          )}

          {Object.keys(report.expenseByCategory).length > 0 && (
            <section className="border border-border bg-surface p-5 sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Outflow detail</p><h2 className="mt-1 mb-4 text-lg font-semibold text-foreground">Expenses by category</h2>

              <div className="space-y-3">
                {Object.entries(report.expenseByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between border border-border bg-background px-3 py-2.5">
                    <span className="text-sm text-foreground">{category}</span>
                    <span className="font-medium text-red-600">-{formatAmount(amount)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-semibold">
                <span className="text-foreground">Total Expenses</span>
                <span className="text-red-600">-{formatAmount(report.totalExpenses)}</span>
              </div>
            </section>
          )}
        </>
      )}
    </div>
    </main>
  );
}

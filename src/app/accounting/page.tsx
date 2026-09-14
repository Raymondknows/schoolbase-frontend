'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ReceiptText,
  AlertCircle,
  Loader2,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DashboardOverview {
  cashPosition: number;
  feeIncome: number;
  otherIncome: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  currency: string;
  range?: {
    startDate?: string;
    endDate?: string;
  };
  recentTransactions: Array<{
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description?: string;
    transactionDate: string;
    category: {
      name: string;
    };
    createdByUser: {
      name: string;
    };
  }>;
}

export default function AccountingDashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'THIS_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'CUSTOM'>('THIS_MONTH');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');

  const filteredTerms = useMemo(() => {
    if (!selectedAcademicYearId) return [] as any[];
    const year = academicYears.find((item) => item.id === selectedAcademicYearId);
    return (year?.terms || []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [academicYears, selectedAcademicYearId]);

  const monthOptions = [
    { value: 'THIS_MONTH', label: 'This month' },
    { value: 'LAST_3_MONTHS', label: 'Last 3 months' },
    { value: 'THIS_YEAR', label: 'This year' },
  ];

  const buildDateRange = (period: typeof periodFilter) => {
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (period === 'LAST_3_MONTHS') {
      const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) };
    }

    if (period === 'THIS_YEAR') {
      const startDate = new Date(today.getFullYear(), 0, 1);
      return { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) };
    }

    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) };
  };

  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await fetch('/api/admin/academic-years', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const years = (data.academicYears || []).sort((a: any, b: any) => {
          if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
          return b.name.localeCompare(a.name);
        });

        setAcademicYears(years);

        const defaultYear = years.find((year: any) => year.isCurrent) || years[0];
        if (defaultYear) {
          setSelectedAcademicYearId(defaultYear.id);
          setSelectedTermId(defaultYear.terms?.[0]?.id || '');
        }
      } catch (error) {
        console.error('Failed to load academic years:', error);
      }
    };

    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (!selectedAcademicYearId) {
      setSelectedTermId('');
      return;
    }

    const terms = filteredTerms;
    if (terms.length > 0 && !terms.some((term: any) => term.id === selectedTermId)) {
      setSelectedTermId(terms[0].id);
    }
  }, [selectedAcademicYearId, filteredTerms, selectedTermId]);

  async function loadData() {
    try {
      setError(null);
      const range = buildDateRange(periodFilter);
      const params = new URLSearchParams({
        startDate: range.startDate,
        endDate: range.endDate,
      });

      if (selectedAcademicYearId) {
        params.set('academicYearId', selectedAcademicYearId);
      }

      if (selectedTermId) {
        params.set('termId', selectedTermId);
      }

      const response = await fetch(`/api/bursar/overview?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [periodFilter, selectedAcademicYearId, selectedTermId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand" />
          <p className="text-sm text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">{error}</p>
              <Button variant="outline" onClick={handleRefresh} className="mt-3">
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-muted">No data available</p>
      </div>
    );
  }

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const netPosition = data.monthlyIncome - data.monthlyExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Accounting Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            School fee collections are the primary income source, with other inflows and operating expenses tracked separately.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-border bg-surface p-5 transition-colors hover:bg-brand-light/40">
          <div className="mb-4 flex items-center gap-2 text-brand">
            <Wallet className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Cash Position</span>
          </div>
          <div className="text-3xl font-semibold text-foreground">
            {data.currency} {formatAmount(data.cashPosition)}
          </div>
          <div className="mt-1 text-xs text-muted">Net cash after fees and expenses</div>
        </div>

        <div className="border border-border bg-surface p-5 transition-colors hover:bg-brand-light/40">
          <div className="mb-4 flex items-center gap-2 text-brand">
            <ArrowUpRight className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">School Fees Collected</span>
          </div>
          <div className="text-3xl font-semibold text-foreground">+{data.currency} {formatAmount(data.feeIncome)}</div>
          <div className="mt-1 text-xs text-muted">Primary school income source</div>
        </div>

        <div className="border border-border bg-surface p-5 transition-colors hover:bg-brand-light/40">
          <div className="mb-4 flex items-center gap-2 text-brand">
            <TrendingUp className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Other Income</span>
          </div>
          <div className="text-3xl font-semibold text-foreground">+{data.currency} {formatAmount(data.otherIncome)}</div>
          <div className="mt-1 text-xs text-muted">Miscellaneous inflows</div>
        </div>

        <div className="border border-border bg-surface p-5 transition-colors hover:bg-brand-light/40">
          <div className="mb-4 flex items-center gap-2 text-brand">
            <ArrowDownRight className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">This Month Expenses</span>
          </div>
          <div className="text-3xl font-semibold text-foreground">-{data.currency} {formatAmount(data.monthlyExpenses)}</div>
          <div className="mt-1 text-xs text-muted">Operating costs and payouts</div>
        </div>
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-[#0A66C2] bg-background px-2.5 py-1.5 text-sm text-foreground shadow-sm">
            <select
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value as 'THIS_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'CUSTOM')}
              className="bg-transparent text-sm text-foreground outline-none w-full sm:w-auto"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={selectedAcademicYearId}
              onChange={(event) => setSelectedAcademicYearId(event.target.value)}
              className="bg-transparent text-sm text-foreground outline-none w-full sm:w-auto"
            >
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>{year.name}{year.isCurrent ? ' (Current)' : ''}</option>
              ))}
            </select>

            <select
              value={selectedTermId}
              onChange={(event) => setSelectedTermId(event.target.value)}
              disabled={!selectedAcademicYearId || filteredTerms.length === 0}
              className="bg-transparent text-sm text-foreground outline-none w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
            >
              {filteredTerms.length === 0 ? (
                <option value="">No terms</option>
              ) : (
                filteredTerms.map((term: any) => (
                  <option key={term.id} value={term.id}>{term.name}</option>
                ))
              )}
            </select>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setPeriodFilter('THIS_MONTH');
              const defaultYear = academicYears.find((year) => year.isCurrent) || academicYears[0];
              setSelectedAcademicYearId(defaultYear?.id || '');
              setSelectedTermId(defaultYear?.terms?.[0]?.id || '');
            }}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Reset
          </Button>

          <Link
            href="/accounting/income"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            <TrendingUp className="h-4 w-4" />
            Record Income
          </Link>

          <Link
            href="/accounting/expenses"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand-light"
          >
            <ReceiptText className="h-4 w-4" />
            Record Expense
          </Link>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
          <Link href="/accounting/cashbook" className="text-sm font-semibold text-brand hover:underline">
            View full cashbook
          </Link>
        </div>

        {data.recentTransactions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background p-8 text-center text-sm text-muted">
            No transactions yet
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-hidden rounded-lg border border-border bg-background">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium">Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-border hover:bg-surface/60 transition-colors">
                      <td className="px-4 py-3 text-muted">{formatDate(transaction.transactionDate)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-border bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-muted">
                          {transaction.category.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{transaction.description || '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}{data.currency} {formatAmount(transaction.amount)}
                      </td>
                      <td className="px-4 py-3 text-muted">{transaction.createdByUser.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 sm:hidden">
              {data.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{transaction.category.name}</p>
                      <p className="mt-1 text-sm text-muted">{transaction.description || '—'}</p>
                      <p className="mt-1 text-xs text-muted">{formatDate(transaction.transactionDate)} • {transaction.createdByUser.name}</p>
                    </div>
                    <div className={`text-right text-sm font-semibold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}{data.currency} {formatAmount(transaction.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle,
  BookOpen,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description?: string;
  transactionDate: string;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  category: {
    name: string;
  };
  createdByUser: {
    name: string;
  };
  referenceNumber?: string;
}

interface CashbookData {
  transactions: Transaction[];
  total: number;
  skip: number;
  take: number;
}

export default function CashbookPage() {
  const [data, setData] = useState<CashbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(50);
  const [reversingId, setReversingId] = useState<string | null>(null);

  async function loadData() {
    try {
      setError(null);
      const typeParam = typeFilter !== 'ALL' ? `&type=${typeFilter}` : '';
      const response = await fetch(
        `/api/bursar/cashbook?skip=${skip}&take=${take}${typeParam}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to load cashbook');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [skip, take, typeFilter]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand" />
          <p className="text-sm text-muted">Loading cashbook...</p>
        </div>
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePageChange = (newSkip: number) => {
    setSkip(newSkip);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function reverseTransaction(transaction: Transaction) {
    const reason = window.prompt('Why is this transaction being reversed?');
    if (!reason?.trim()) return;

    setReversingId(transaction.id);
    try {
      const response = await fetch(`/api/bursar/transactions/${transaction.id}/reverse`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to reverse transaction');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reverse transaction');
    } finally {
      setReversingId(null);
    }
  }

  const totalPages = data ? Math.ceil(data.total / take) : 0;
  const currentPage = data ? Math.floor(data.skip / take) + 1 : 1;

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <BookOpen size={17} /> Accounting
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Cashbook</h1>
          <p className="mt-1 text-sm text-muted">
            Review every posted income and expense entry across the school
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setRefreshing(true);
            loadData();
          }}
          disabled={refreshing}
          className="inline-flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-border bg-surface p-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as 'ALL' | 'INCOME' | 'EXPENSE');
              setSkip(0);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="ALL">All Transactions</option>
            <option value="INCOME">Income Only</option>
            <option value="EXPENSE">Expenses Only</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Per Page</label>
          <select
            value={take}
            onChange={(e) => {
              setTake(parseInt(e.target.value));
              setSkip(0);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Transactions {data && `(${data.total} total)`}
          </h2>
        </div>

        {!data || data.transactions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background p-8 text-center text-sm text-muted">
            No transactions found
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-background text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Recorded By</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-border hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3 text-muted">{formatDate(transaction.transactionDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[.08em] ${
                            transaction.type === 'INCOME'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-red-200 bg-red-50 text-red-700'
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{transaction.category.name}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{transaction.description || '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted">{transaction.referenceNumber || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'INCOME' ? '+' : '-'}
                          {formatAmount(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {transaction.status === 'POSTED' ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Posted</span>
                            </>
                          ) : transaction.status === 'REVERSED' ? (
                            <span className="text-sm text-red-600">Reversed</span>
                          ) : (
                            <span className="text-sm text-amber-600">Draft</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{transaction.createdByUser.name}</td>
                      <td className="px-4 py-3 text-right">{transaction.status === 'POSTED' ? <button type="button" onClick={() => reverseTransaction(transaction)} disabled={reversingId === transaction.id} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-muted transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50" title="Reverse transaction"><RotateCcw className="h-3.5 w-3.5" />{reversingId === transaction.id ? 'Reversing...' : 'Reverse'}</button> : <span className="text-xs text-muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 sm:hidden">
              {data.transactions.map((transaction) => (
                <div key={transaction.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{transaction.category.name}</p>
                      <p className="mt-1 text-sm text-muted">{transaction.description || '—'}</p>
                      <p className="mt-1 text-xs text-muted">{formatDate(transaction.transactionDate)} • {transaction.createdByUser.name}</p>
                    </div>
                    <div className={`text-right text-sm font-semibold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}{formatAmount(transaction.amount)}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[.08em] ${transaction.type === 'INCOME' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                      {transaction.type}
                    </span>
                    <span className="text-xs text-muted">{transaction.referenceNumber || '—'}</span>
                  </div>
                  {transaction.status === 'POSTED' && <button type="button" onClick={() => reverseTransaction(transaction)} disabled={reversingId === transaction.id} className="mt-3 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-muted transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" />{reversingId === transaction.id ? 'Reversing...' : 'Reverse transaction'}</button>}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={skip === 0}
                    onClick={() => handlePageChange(Math.max(0, skip - take))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!data || skip + take >= data.total}
                    onClick={() => handlePageChange(skip + take)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle,
  TrendingDown,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description?: string;
  transactionDate: string;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  category: Category;
  createdByUser: {
    name: string;
  };
  referenceNumber?: string;
}

export default function ExpensesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    referenceNumber: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  async function loadData() {
    try {
      setError(null);
      const [categoriesRes, transactionsRes] = await Promise.all([
        fetch('/api/bursar/categories', { credentials: 'include' }),
        fetch('/api/bursar/cashbook?type=EXPENSE', { credentials: 'include' }),
      ]);

      if (!categoriesRes.ok || !transactionsRes.ok) {
        throw new Error('Failed to load data');
      }

      const categoriesData = await categoriesRes.json();
      const transactionsData = await transactionsRes.json();

      setCategories(categoriesData.filter((c: Category) => c.type === 'EXPENSE'));
      setTransactions(transactionsData.transactions);
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
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/bursar/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          categoryId: formData.categoryId,
          amount: parseFloat(formData.amount),
          description: formData.description,
          referenceNumber: formData.referenceNumber,
          transactionDate: formData.transactionDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create expense entry');
      }

      setFormData({
        categoryId: '',
        amount: '',
        description: '',
        referenceNumber: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand" />
          <p className="text-sm text-muted">Loading expenses...</p>
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

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <TrendingDown size={17} /> Accounting
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Record Expenses</h1>
          <p className="mt-1 text-sm text-muted">
            Log spending and operational costs against each accounting category
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

      <div className="mb-8 rounded-lg border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-2 text-brand">
          <CreditCard className="h-4 w-4" />
          <h2 className="text-lg font-semibold text-foreground">New Expense Entry</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                disabled={submitting}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                disabled={submitting}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Date</label>
              <input
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                disabled={submitting}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Reference Number (optional)</label>
              <input
                type="text"
                placeholder="Invoice, receipt, PO, etc."
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                disabled={submitting}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Description (optional)</label>
            <textarea
              placeholder="Notes about this expense..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={submitting}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || !formData.categoryId || !formData.amount} className="inline-flex items-center gap-2">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Expense Entry
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Expense Entries</h2>

        {transactions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background p-8 text-center text-sm text-muted">
            No expense entries recorded yet
          </div>
        ) : (
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-border hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 text-foreground">{transaction.category.name}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{formatAmount(transaction.amount)}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(transaction.transactionDate)}</td>
                    <td className="px-4 py-3 text-muted">{transaction.referenceNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {transaction.status === 'POSTED' ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Posted</span>
                          </>
                        ) : (
                          <span className="text-sm text-amber-600">Draft</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{transaction.createdByUser.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

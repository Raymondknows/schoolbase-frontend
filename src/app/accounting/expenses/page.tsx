'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle,
  TrendingDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { playCloseTone, playOpenTone } from '@/lib/sounds';
import AdminSkeleton from '@/components/ui/skeleton';

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
  const [postingId, setPostingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    paymentMethod: 'CASH',
    description: '',
    referenceNumber: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  function openExpenseForm() {
    setIsFormOpen(true);
    playOpenTone();
  }

  function closeExpenseForm() {
    setIsFormOpen(false);
    playCloseTone();
  }

  useEffect(() => {
    if (!isFormOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeExpenseForm();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormOpen]);

  async function loadData() {
    try {
      setError(null);
      const [categoriesRes, transactionsRes] = await Promise.all([
        fetch('/api/bursar/categories', { credentials: 'include' }),
        fetch('/api/bursar/cashbook?type=EXPENSE&status=ALL', { credentials: 'include' }),
      ]);

      if (!categoriesRes.ok || !transactionsRes.ok) {
        const failedResponse = !categoriesRes.ok ? categoriesRes : transactionsRes;
        const failedEndpoint = !categoriesRes.ok ? 'categories' : 'expense transactions';
        const failedBody = await failedResponse.json().catch(() => ({}));
        throw new Error(`Failed to load ${failedEndpoint} (${failedResponse.status}): ${failedBody.error || failedResponse.statusText}`);
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

  async function postExpense(transaction: Transaction) {
    setPostingId(transaction.id);
    try {
      const response = await fetch(`/api/bursar/transactions/${transaction.id}/post`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to approve expense');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve expense');
    } finally {
      setPostingId(null);
    }
  }

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
          paymentMethod: formData.paymentMethod,
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
        paymentMethod: 'CASH',
        description: '',
        referenceNumber: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });

      closeExpenseForm();
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <main className="min-h-screen pb-12">
    <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
      <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand">
            <TrendingDown size={17} /> Accounting
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Record expenses</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Log spending and operational costs with a clear approval trail for every category.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={openExpenseForm} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Record expense
          </Button>
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
      </div>
      </div>
      </header>

      {error && (
        <div className="mb-6 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="new-expense-title">
          <button type="button" aria-label="Close new expense form" onClick={closeExpenseForm} className="absolute inset-0 cursor-pointer bg-slate-950/35 backdrop-blur-[2px]" />
          <aside className="relative ml-auto flex h-full w-full max-w-md flex-col overflow-hidden border-l border-border bg-surface shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-brand/10 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center border border-rose-200 bg-rose-50"><TrendingDown className="h-5 w-5 text-rose-700" /></div><div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-brand">Accounting</p><h2 id="new-expense-title" className="mt-1 text-xl font-semibold text-foreground">New expense entry</h2><p className="mt-1 text-sm text-muted">Record a school expense for approval.</p></div></div>
              <button type="button" onClick={closeExpenseForm} aria-label="Close new expense form" className="rounded-md border border-border p-2 text-muted transition hover:bg-background hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto bg-background p-5 sm:p-6">
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
              <label className="mb-2 block text-sm font-medium text-foreground">Payment method</label>
              <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} disabled={submitting} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="CARD">Card</option>
                <option value="ONLINE">Online</option>
                <option value="OTHER">Other</option>
              </select>
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
          </aside>
        </div>
      )}

      <section className="border border-border bg-surface">
        <div className="border-b border-border px-5 py-4"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Ledger</p><h2 className="mt-1 text-lg font-semibold text-foreground">Expense entries</h2><p className="mt-1 text-sm text-muted">Track spending, drafts, and approval status.</p></div>

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
                  <th className="px-4 py-3 text-right font-medium">Action</th>
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
                        ) : transaction.status === 'REVERSED' ? (
                          <span className="text-sm text-red-600">Reversed</span>
                        ) : (
                          <span className="text-sm text-amber-600">Draft</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{transaction.createdByUser.name}</td>
                    <td className="px-4 py-3 text-right">{transaction.status === 'DRAFT' ? <button type="button" onClick={() => postExpense(transaction)} disabled={postingId === transaction.id} className="inline-flex items-center gap-1 rounded-md border border-brand/30 px-2 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle className="h-3.5 w-3.5" />{postingId === transaction.id ? 'Approving...' : 'Approve'}</button> : <span className="text-xs text-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
    </main>
  );
}

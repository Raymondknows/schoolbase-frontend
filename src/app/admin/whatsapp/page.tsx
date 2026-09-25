"use client";

import { getBackendUrl } from "@/lib/backend-url";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Mail, AlertCircle, CheckCircle, Clock, TrendingUp, Search } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";
import { UserGuide, type PageHelpGuide } from "@/components/ui/user-guide";
import SubscriptionModal from "@/components/subscription-modal";
import AdminSkeleton from "@/components/ui/skeleton";

interface Notification {
  id: string;
  date: string;
  guardian: string;
  type: "ISSUE_BILLS" | "SEND_REMINDER" | "ATTENDANCE_UPDATE";
  title: string;
  body: string;
  channel: "WHATSAPP" | "EMAIL";
  status: "SENT" | "FAILED" | "PENDING";
  sentAt?: string;
  failureReason?: string;
  reference?: string;
}

interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byChannel: { WHATSAPP: number; EMAIL: number };
  byType: { ISSUE_BILLS: number; SEND_REMINDER: number; ATTENDANCE_UPDATE: number };
}

const STATUS_CONFIG: { [key: string]: { label: string; color: string; icon: any } } = {
  SENT: { label: "Sent", color: "bg-green-100 text-green-800", icon: CheckCircle },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-800", icon: AlertCircle },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
};

const TYPE_CONFIG: { [key: string]: { label: string; color: string } } = {
  ISSUE_BILLS: { label: "Invoice Issued", color: "bg-blue-50 text-blue-900" },
  SEND_REMINDER: { label: "Fee Reminder", color: "bg-orange-50 text-orange-900" },
  ATTENDANCE_UPDATE: { label: "Attendance Update", color: "bg-purple-50 text-purple-900" },
};

const CHANNEL_CONFIG: { [key: string]: { label: string; icon: any; color: string } } = {
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle, color: "text-green-600" },
  EMAIL: { label: "Email", icon: Mail, color: "text-blue-600" },
};

// Fallback config for unknown types/channels/statuses
const getTypeConfig = (type?: string) => 
  (TYPE_CONFIG as any)[type!] || { label: type || "Unknown", color: "bg-gray-50 text-gray-900" };

const getChannelConfig = (channel?: string) => 
  (CHANNEL_CONFIG as any)[channel!] || { label: channel || "Unknown", icon: Send, color: "text-gray-600" };

const getStatusConfig = (status?: string) => 
  (STATUS_CONFIG as any)[status!] || { label: status || "Unknown", color: "bg-gray-100 text-gray-800", icon: AlertCircle };

const PAGE_SIZE_OPTIONS = [10, 50, 100, 200, 500] as const;
const DEFAULT_ITEMS_PER_PAGE = 50;

const HELP_GUIDE: PageHelpGuide = {
  title: "WhatsApp & Email Notifications",
  overview: "Monitor all WhatsApp and email notifications sent to parents and guardians. Track delivery status and troubleshoot failed messages.",
  steps: [
    "View all notifications sent through WhatsApp and Email channels.",
    "Check the status of each notification (Sent, Failed, Pending).",
    "Filter notifications by type (invoices, reminders, attendance) or status.",
    "Review failure reasons to understand why messages didn't deliver.",
    "Monitor statistics to see overall notification performance.",
  ],
  commonTasks: [
    {
      title: "Check Notification Status",
      description: "See if messages reached parents successfully.",
      tips: [
        "Green 'Sent' status means the message was delivered",
        "Yellow 'Pending' means the system is still processing",
        "Red 'Failed' means the message didn't reach the recipient",
        "View the failure reason by clicking on the failed notification",
      ],
    },
    {
      title: "View Notification Details",
      description: "See the full content and recipient information.",
      tips: [
        "Click any notification row to see full details",
        "See who received the message (guardian name)",
        "Check the message content and when it was sent",
        "View the sending channel (WhatsApp or Email)",
      ],
    },
    {
      title: "Filter Notifications",
      description: "Find specific types of messages.",
      tips: [
        "Use status filter to find Failed or Pending messages",
        "Filter by type: Invoice, Fee Reminder, or Attendance",
        "Filter by channel: WhatsApp or Email",
        "Combine filters to narrow down results",
      ],
    },
  ],
  faqs: [
    {
      question: "Why did a notification fail?",
      answer: "Common reasons include invalid phone numbers, network issues, or the recipient opting out of WhatsApp messages. Check the failure reason in the notification details.",
    },
    {
      question: "How long does delivery take?",
      answer: "WhatsApp and Email usually deliver within seconds. Pending messages should resolve within a few minutes. If stuck longer, it may indicate a system issue.",
    },
    {
      question: "Can I resend a failed notification?",
      answer: "Yes. Select the failed WhatsApp rows and resend only those failed deliveries; successful ones are not retriggered and invoices or announcements are not reissued.",
    },
  ],
};

export default function WhatsAppPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<{
    reason?: string;
    schoolName?: string;
  } | null>(null);
  const [whatsAppConnected, setWhatsAppConnected] = useState<boolean | null>(null);
  const [whatsAppStatusMessage, setWhatsAppStatusMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterChannel, setFilterChannel] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<string[]>([]);
  const [retryingSelected, setRetryingSelected] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch notifications on mount and when filters change
  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      setError(null);
      try {
        const backendUrl = getBackendUrl();
        const params = new URLSearchParams({
          limit: String(itemsPerPage * 5), // Fetch more for client-side filtering
          offset: String(0),
        });

        if (filterType !== "ALL") params.append("type", filterType);
        if (filterStatus !== "ALL") params.append("status", filterStatus);
        if (filterChannel !== "ALL") params.append("channel", filterChannel);

        const response = await fetch(`${backendUrl}/api/admin/notifications?${params}`, {
          credentials: "include",
        });

        if (response.status === 403) {
          const data = await response.json();
          if (data?.code === 'SUBSCRIPTION_INACTIVE') {
            setSubscriptionError({
              reason: data.reason || 'Your school subscription is not active.',
              schoolName: data.school?.name,
            });
          }
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setStats(data.stats);

          try {
              const whatsappRes = await fetch(`/api/admin/whatsapp/status`, {
              credentials: "include",
              headers: { "Content-Type": "application/json" },
            });
            if (whatsappRes.ok) {
              const whatsappData = await whatsappRes.json();
              setWhatsAppConnected(whatsappData?.session?.status === 'connected');
              setWhatsAppStatusMessage(whatsappData?.session?.statusMessage || whatsappData?.session?.status || null);
            } else {
              setWhatsAppConnected(false);
              setWhatsAppStatusMessage('Unable to retrieve WhatsApp status.');
            }
          } catch (err) {
            console.error('Error loading WhatsApp status:', err);
            setWhatsAppConnected(false);
            setWhatsAppStatusMessage('Unable to retrieve WhatsApp status.');
          }
        } else {
          throw new Error("Failed to load notifications");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load communications");
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, [filterType, filterStatus, filterChannel, itemsPerPage]);

  const selectedFailedIds = useMemo(() =>
    new Set(selectedNotificationIds),
    [selectedNotificationIds],
  );

  // Filter notifications by search query
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) =>
      notif.guardian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.reference?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notifications, searchQuery]);

  const failedNotificationsInView = filteredNotifications.filter((n) => n.status === 'FAILED');

  const typeOptions = [
    { value: 'ALL', label: 'All Types' },
    { value: 'ISSUE_BILLS', label: 'Invoice' },
    { value: 'SEND_REMINDER', label: 'Reminder' },
    { value: 'ATTENDANCE_UPDATE', label: 'Attendance' },
  ];

  const statusOptions = [
    { value: 'ALL', label: 'All' },
    { value: 'SENT', label: 'Sent' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'PENDING', label: 'Pending' },
  ];

  const channelOptions = [
    { value: 'ALL', label: 'All Channels' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'EMAIL', label: 'Email' },
  ];

  async function handleRetrySelectedFailed() {
    const idsToRetry = filteredNotifications
      .filter((notif) => notif.status === 'FAILED' && selectedFailedIds.has(notif.id))
      .map((notif) => notif.id);

    if (idsToRetry.length === 0) {
      setError('Select at least one failed WhatsApp notification to retry.');
      return;
    }

    setRetryingSelected(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/notifications/retry-failed`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: idsToRetry }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to retry selected notifications');
      }

      setNotifications((current) =>
        current.map((notif) =>
          idsToRetry.includes(notif.id)
            ? { ...notif, status: 'PENDING', sentAt: undefined, failureReason: 'Queued for background retry' }
            : notif,
        ),
      );
      setSelectedNotificationIds([]);
      setCurrentPage(1);
      setWhatsAppStatusMessage(data.message || 'Selected failed messages were queued for background retry.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to retry selected notifications.');
    } finally {
      setRetryingSelected(false);
    }
  }

  // Paginate notifications
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(start, start + itemsPerPage);
  }, [filteredNotifications, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSkeleton />
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-brand" />
            Communications Log
          </h1>
          <p className="text-muted mb-6">View all notifications sent to parents</p>
        </div>
        <SubscriptionModal reason={subscriptionError.reason} schoolName={subscriptionError.schoolName} />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
        <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand">
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> Communication operations
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Communications log</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Monitor parent notifications across WhatsApp and email.</p>
            </div>

            {whatsAppConnected !== null && (
              <div className="inline-flex items-center gap-2.5 self-start rounded-full border border-border bg-surface px-2.5 py-1.5 shadow-sm sm:self-auto" title={whatsAppConnected ? 'WhatsApp connected — Ready to send messages' : 'WhatsApp disconnected — Reconnect via settings'}>
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${whatsAppConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  <WhatsAppIcon className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground">
                    {whatsAppConnected ? 'Connected' : 'Disconnected'}
                  </span>
                  <span className="hidden text-[10px] text-muted sm:inline">
                    {whatsAppConnected ? 'Ready' : 'Reconnect'}
                  </span>
                </div>
                <span className={`h-2 w-2 rounded-full ${whatsAppConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
            )}
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {stats && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-border bg-surface p-5 transition-colors hover:border-brand/40 hover:bg-brand-light/20">
              <div className="mb-4 flex items-center gap-2 text-brand">
                <TrendingUp className="h-4 w-4 text-brand" />
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Total</span>
              </div>
              <div className="text-3xl font-semibold text-foreground">{stats.total}</div>
              <div className="mt-1 text-xs text-muted">All notifications</div>
            </div>

            <div className="border border-border bg-surface p-5 transition-colors hover:border-brand/40 hover:bg-brand-light/20">
              <div className="mb-4 flex items-center gap-2 text-brand">
                <CheckCircle className="h-4 w-4 text-brand" />
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Successful</span>
              </div>
              <div className="text-3xl font-semibold text-foreground">{stats.sent}</div>
              <div className="mt-1 text-xs text-muted">{stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(0) : 0}% success rate</div>
            </div>

            <div className="border border-border bg-surface p-5 transition-colors hover:border-brand/40 hover:bg-brand-light/20">
              <div className="mb-4 flex items-center gap-2 text-brand">
                <AlertCircle className="h-4 w-4 text-brand" />
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Failed</span>
              </div>
              <div className="text-3xl font-semibold text-foreground">{stats.failed}</div>
              <div className="mt-1 text-xs text-muted">Delivery failures</div>
            </div>

            <div className="border border-border bg-surface p-5 transition-colors hover:border-brand/40 hover:bg-brand-light/20">
              <div className="mb-4 flex items-center gap-2 text-brand">
                <Clock className="h-4 w-4 text-brand" />
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Pending</span>
              </div>
              <div className="text-3xl font-semibold text-foreground">{stats.pending}</div>
              <div className="mt-1 text-xs text-muted">Still processing</div>
            </div>
          </section>
        )}

        <section className="border border-border bg-surface p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className={`overflow-hidden transition-all duration-300 ease-out flex-shrink-0 ${isSearchOpen ? 'w-72 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full'}`}>
                <input
                  type="text"
                  placeholder="Search guardian or reference..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-md border border-brand bg-background px-4 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={() => setIsSearchOpen((open) => !open)}
                aria-label={isSearchOpen ? 'Close search' : 'Search notifications'}
                title={isSearchOpen ? 'Close search' : 'Search notifications'}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand p-0 text-sm font-semibold text-white transition hover:bg-brand-hover sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">{isSearchOpen ? 'Close' : 'Search'}</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="whitespace-nowrap"
                onClick={() => {
                  const failedIds = filteredNotifications
                    .filter((notif) => notif.status === 'FAILED')
                    .map((notif) => notif.id);
                  setSelectedNotificationIds(
                    selectedNotificationIds.length === failedIds.length && failedIds.length > 0
                      ? []
                      : failedIds,
                  );
                }}
                disabled={failedNotificationsInView.length === 0}
              >
                {selectedNotificationIds.length > 0 && failedNotificationsInView.length > 0 && selectedNotificationIds.length === failedNotificationsInView.length
                  ? 'Clear failed'
                  : 'Select failed'}
              </Button>

              <Button
                type="button"
                variant="primary"
                className="whitespace-nowrap"
                onClick={handleRetrySelectedFailed}
                disabled={retryingSelected || selectedNotificationIds.length === 0}
              >
                {retryingSelected ? 'Retrying…' : `Resend selected (${selectedNotificationIds.length})`}
              </Button>
            </div>
          </div>
        </section>

        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <label className="text-sm font-medium text-muted">Type:</label>
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setFilterType(option.value);
                  setCurrentPage(1);
                }}
                className={`rounded-md border px-3 py-1 text-xs font-semibold transition ${
                  filterType === option.value
                    ? 'border-brand bg-brand text-white'
                    : 'border-border bg-background text-muted hover:border-brand/40 hover:bg-surface'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="text-sm font-medium text-muted">Status:</label>
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setFilterStatus(option.value);
                  setCurrentPage(1);
                }}
                className={`rounded-md border px-3 py-1 text-xs font-semibold transition ${
                  filterStatus === option.value
                    ? 'border-brand bg-brand text-white'
                    : 'border-border bg-background text-muted hover:border-brand/40 hover:bg-surface'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="text-sm font-medium text-muted">Channel:</label>
            {channelOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setFilterChannel(option.value);
                  setCurrentPage(1);
                }}
                className={`rounded-md border px-3 py-1 text-xs font-semibold transition ${
                  filterChannel === option.value
                    ? 'border-brand bg-brand text-white'
                    : 'border-border bg-background text-muted hover:border-brand/40 hover:bg-surface'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Showing {paginatedNotifications.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–
            {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
          <label className="text-sm text-muted whitespace-nowrap">
            Rows per page
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="ml-2 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        </div>

        {!loading ? (
          <div className="overflow-hidden border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-background text-muted">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">
                      <input
                        type="checkbox"
                        aria-label="Select failed notifications"
                        checked={
                          failedNotificationsInView.length > 0 &&
                          failedNotificationsInView.every((notif) => selectedFailedIds.has(notif.id))
                        }
                        onChange={() => {
                          const failedIds = failedNotificationsInView.map((notif) => notif.id);
                          if (failedIds.length === 0) return;
                          const allSelected = failedIds.every((id) => selectedFailedIds.has(id));
                          setSelectedNotificationIds((current) => {
                            if (allSelected) {
                              return current.filter((id) => !failedIds.includes(id));
                            }
                            return [...new Set([...current, ...failedIds])];
                          });
                        }}
                        className="h-4 w-4 rounded border-border"
                      />
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">Guardian</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">Channel</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedNotifications.length > 0 ? (
                    paginatedNotifications.map((notif) => {
                      const typeConfig = getTypeConfig(notif.type);
                      const channelConfig = getChannelConfig(notif.channel);
                      const statusConfig = getStatusConfig(notif.status);
                      const ChannelIcon = channelConfig.icon;
                      const StatusIcon = statusConfig.icon;
                      const isSelected = selectedFailedIds.has(notif.id) && notif.status === 'FAILED';

                      return (
                        <tr key={notif.id} className="border-t border-border transition-colors hover:bg-surface/50">
                          <td className="px-3 py-4 text-sm text-foreground">
                            {notif.status === 'FAILED' ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedNotificationIds((current) =>
                                    current.includes(notif.id)
                                      ? current.filter((id) => id !== notif.id)
                                      : [...current, notif.id],
                                  );
                                }}
                                className="h-4 w-4 rounded border-border"
                                aria-label={`Select failed notification for ${notif.guardian}`}
                              />
                            ) : (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm text-foreground">
                            {new Date(notif.date).toLocaleDateString()} {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <div className="font-medium text-foreground">{notif.guardian}</div>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <ChannelIcon className={`h-4 w-4 ${channelConfig.color}`} />
                              <span className="text-foreground">{channelConfig.label}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="h-4 w-4" />
                              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <code className="rounded bg-surface-2 px-2 py-1 text-xs text-foreground">{notif.reference || '-'}</code>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-muted">No communications found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border bg-background px-5 py-4">
                <div className="text-sm text-muted">
                  Page {currentPage} of {totalPages} ({filteredNotifications.length} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="secondary"
                    className="text-sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="secondary"
                    className="text-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <p className="text-muted">Loading communications...</p>
          </div>
        )}

        <UserGuide guide={HELP_GUIDE} />
      </div>
    </main>
  );
}

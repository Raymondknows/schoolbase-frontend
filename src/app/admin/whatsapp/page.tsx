"use client";

import { getBackendUrl } from "@/lib/backend-url";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Mail, AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";
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
      answer: "Currently, failed notifications must be resent through their original trigger (e.g., resend reminders or reissue invoices). Manual resend is coming in a future update.",
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

  // Filter notifications by search query
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) =>
      notif.guardian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.reference?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notifications, searchQuery]);

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
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <WhatsAppIcon className="h-[17px] w-[17px] text-[#25D366]" />
            Communication operations
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Communications log</h1>
          <p className="mt-1 text-muted">Monitor parent notifications across WhatsApp and email</p>
        </div>

        {whatsAppConnected !== null && (
          <div className="inline-flex items-center gap-3 self-start rounded-lg border border-border bg-surface px-4 py-2.5 text-sm sm:self-auto">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${whatsAppConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <WhatsAppIcon className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {whatsAppConnected ? 'WhatsApp connected' : 'WhatsApp disconnected'}
              </span>
              <span className="text-xs text-muted">
                {whatsAppConnected ? 'Ready for messages.' : 'Reconnect via settings.'}
              </span>
            </div>
            <span className={`h-2.5 w-2.5 rounded-full ${whatsAppConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Sent */}
          <div className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2 text-brand"><TrendingUp size={18} /><span className="text-xs font-bold uppercase tracking-[.12em] text-muted">Total sent</span></div>
            <div className="text-3xl font-semibold text-foreground">{stats.total}</div>
            <div className="mt-1 text-xs text-muted">All channels combined</div>
          </div>

          {/* Successful */}
          <div className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2 text-brand"><CheckCircle size={18} /><span className="text-xs font-bold uppercase tracking-[.12em] text-muted">Successful</span></div>
            <div className="text-3xl font-semibold text-foreground">{stats.sent}</div>
            <div className="mt-1 text-xs text-muted">{stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(0) : 0}% success rate</div>
          </div>

          {/* Failed */}
          <div className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2 text-brand"><AlertCircle size={18} /><span className="text-xs font-bold uppercase tracking-[.12em] text-muted">Failed</span></div>
            <div className="text-3xl font-semibold text-foreground">{stats.failed}</div>
            <div className="mt-1 text-xs text-muted">Delivery failures</div>
          </div>

          {/* Pending */}
          <div className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2 text-brand"><Clock size={18} /><span className="text-xs font-bold uppercase tracking-[.12em] text-muted">Pending</span></div>
            <div className="text-3xl font-semibold text-foreground">{stats.pending}</div>
            <div className="mt-1 text-xs text-muted">Still processing</div>
          </div>

          {/* Channel Breakdown */}
          <div className="border border-border bg-surface p-5 sm:col-span-2 lg:col-span-4">
            <div className="mb-4 flex items-center gap-2 text-brand"><MessageCircle size={18} /><span className="text-xs font-bold uppercase tracking-[.12em] text-muted">Channel mix</span></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><div className="text-2xl font-semibold text-foreground">{stats.byChannel.WHATSAPP}</div><div className="mt-1 text-xs text-muted">WhatsApp notifications</div></div>
              <div><div className="text-2xl font-semibold text-foreground">{stats.byChannel.EMAIL}</div><div className="mt-1 text-xs text-muted">Email notifications</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <section className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-center">
      <div className="grid flex-1 gap-3 sm:grid-cols-5">
        {/* Search Box */}
        <div className="sm:col-span-2">
          <input
            type="text"
            placeholder="Search by guardian name or reference..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-brand"
          />
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
        >
          <option value="ALL">All Types</option>
          <option value="ISSUE_BILLS">Invoice Issued</option>
          <option value="SEND_REMINDER">Fee Reminder</option>
          <option value="ATTENDANCE_UPDATE">Attendance</option>
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
        >
          <option value="ALL">All Status</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
        </select>

        {/* Channel Filter */}
        <select
          value={filterChannel}
          onChange={(e) => {
            setFilterChannel(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
        >
          <option value="ALL">All Channels</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="EMAIL">Email</option>
        </select>
      </div>
      </section>

      {/* Results Info */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Showing {paginatedNotifications.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–
          {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
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
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Notifications Table */}
      {!loading ? (
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-[#f6f8fa]">
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">Guardian</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">Channel</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[.1em] text-muted">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedNotifications.length > 0 ? (
                  paginatedNotifications.map((notif) => {
                    const typeConfig = getTypeConfig(notif.type);
                    const channelConfig = getChannelConfig(notif.channel);
                    const statusConfig = getStatusConfig(notif.status);
                    const ChannelIcon = channelConfig.icon;
                    const StatusIcon = statusConfig.icon;
                    return (
                      <tr key={notif.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-5 py-4 text-sm text-foreground">
                          {new Date(notif.date).toLocaleDateString()} {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <div className="font-medium text-foreground">{notif.guardian}</div>
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <Badge className={typeConfig.color}>
                            {typeConfig.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <ChannelIcon className={`h-4 w-4 ${channelConfig.color}`} />
                            <span className="text-foreground">{channelConfig.label}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4`} />
                            <Badge className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <code className="bg-surface-2 px-2 py-1 rounded text-xs text-foreground">
                            {notif.reference || "-"}
                          </code>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted">
                      No communications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border bg-[#f6f8fa] px-5 py-4">
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

      {/* Help & Guide */}
      <UserGuide guide={HELP_GUIDE} />
    </div>
    </main>
  );
}

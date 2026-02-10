import { useState, useEffect } from "react";
import { supabase } from "../supabase";

type Notification = {
  id: string;
  student_id: string;
  company_id: string;
  company_name: string;
  message: string;
  type: string;
  old_stage: string | null;
  new_stage: string | null;
  conversation_id: string | null;
  read: boolean;
  created_at: string;
};

interface NotificationsComponentProps {
  studentId: string;
  onNavigateToMessages?: (conversationId?: string) => void;
}

export default function NotificationsComponent({
  studentId,
  onNavigateToMessages,
}: NotificationsComponentProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          id,
          student_id,
          company_id,
          message,
          type,
          old_stage,
          new_stage,
          conversation_id,
          read,
          created_at,
          companies!notifications_company_id_fkey (
            name
          )
        `
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading notifications:", error);
        return;
      }

      const mapped: Notification[] = (data || []).map((item: any) => ({
        id: item.id,
        student_id: item.student_id,
        company_id: item.company_id,
        company_name: item.companies?.name || "Unknown Company",
        message: item.message,
        type: item.type,
        old_stage: item.old_stage,
        new_stage: item.new_stage,
        conversation_id: item.conversation_id,
        read: item.read,
        created_at: item.created_at,
      }));

      setNotifications(mapped);
    } catch (err) {
      console.error("Unexpected error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Unexpected error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return;
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Unexpected error marking all as read:", err);
    }
  };

  const getStageLabel = (stage: string) => {
    const stageMap: { [key: string]: string } = {
      shortlisted: "Shortlisted",
      contacted: "Contacted",
      interviewing: "Interviewing",
      hired: "Hired",
      not_a_fit: "Not a Fit",
    };
    return stageMap[stage] || stage;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                You have {unreadCount} unread notification
                {unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm font-medium text-brand-blue hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔔</div>
            <p className="text-gray-500">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-2">
              You'll be notified when companies update your application status
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isMessage = notification.type === "message";
              const isClickable = isMessage && notification.conversation_id && onNavigateToMessages;

              return (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (isClickable) {
                      markAsRead(notification.id);
                      onNavigateToMessages(notification.conversation_id!);
                    }
                  }}
                  className={`border rounded-lg p-4 transition ${
                    notification.read
                      ? "bg-white border-gray-200"
                      : "bg-blue-50 border-brand-blue"
                  } ${isClickable ? "cursor-pointer hover:shadow-md" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {isMessage ? (
                        notification.read ? (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-xl">💬</span>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center">
                            <span className="text-xl">💬</span>
                          </div>
                        )
                      ) : notification.read ? (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-xl">📬</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center">
                          <span className="text-xl">📩</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-gray-900">
                          {notification.company_name}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {getTimeAgo(notification.created_at)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">
                        {notification.message}
                      </p>

                      {notification.type === "stage_change" &&
                        notification.old_stage &&
                        notification.new_stage && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {getStageLabel(notification.old_stage)}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="px-2 py-1 bg-brand-blue/10 text-brand-blue rounded font-medium">
                              {getStageLabel(notification.new_stage)}
                            </span>
                          </div>
                        )}

                      {isMessage && isClickable && (
                        <p className="mt-2 text-xs text-brand-blue font-medium">
                          Click to view conversation →
                        </p>
                      )}

                      {!notification.read && !isClickable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="mt-3 text-xs text-brand-blue hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

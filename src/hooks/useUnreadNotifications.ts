import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export function useUnreadNotifications(studentId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!studentId) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("read", false);

      if (error) {
        console.error("Error fetching unread count:", error);
        return;
      }

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`unread-notifications:${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  return unreadCount;
}

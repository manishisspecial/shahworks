"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const employee_id = typeof window !== "undefined" ? localStorage.getItem("employee_id") : null;

  useEffect(() => {
    if (!employee_id) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, is_read, created_at")
        .eq("recipient_employee_id", employee_id)
        .order("created_at", { ascending: false });
      setNotifications(data || []);
      setLoading(false);
      // Mark all as read
      await supabase.from("notifications").update({ is_read: true }).eq("recipient_employee_id", employee_id).eq("is_read", false);
    })();
  }, [employee_id]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Notifications</h1>
        {loading ? (
          <div>Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-400">No notifications.</div>
        ) : (
          <ul className="space-y-4">
            {notifications.map(n => (
              <li key={n.id} className={`p-4 rounded border ${n.is_read ? "bg-gray-50" : "bg-blue-50 border-blue-200"}`}>
                <div className="font-semibold text-lg mb-1">{n.title}</div>
                <div className="text-gray-700 mb-1">{n.message}</div>
                <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 
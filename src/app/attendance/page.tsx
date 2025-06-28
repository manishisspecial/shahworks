// Requires: npm install --save date-fns @types/date-fns
"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";

interface Attendance {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  total_hours: number | null;
}

export default function AttendancePage() {
  const { user } = useUser();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<Attendance | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchAttendance = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("attendance")
        .select("id, date, check_in, check_out, total_hours")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      if (!error && data) {
        setAttendance(data);
        const todayStr = format(new Date(), "yyyy-MM-dd");
        setToday(data.find((a: Attendance) => a.date === todayStr) || null);
      }
      setLoading(false);
    };
    fetchAttendance();
  }, [user]);

  const handleCheckIn = async () => {
    if (!user) return;
    setActionLoading(true);
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const now = new Date().toISOString();
    if (today) {
      // Check out
      await supabase
        .from("attendance")
        .update({ check_out: now })
        .eq("id", today.id)
        .select();
    } else {
      // Check in
      await supabase
        .from("attendance")
        .insert({ user_id: user.id, date: todayStr, check_in: now })
        .select();
    }
    setActionLoading(false);
    window.location.reload();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold text-center">Attendance</h1>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
            onClick={handleCheckIn}
            disabled={actionLoading}
          >
            {today && !today.check_out ? "Check Out" : "Check In"}
          </button>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Check In</th>
                  <th className="p-2 border">Check Out</th>
                  <th className="p-2 border">Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.id}>
                    <td className="p-2 border text-center">{a.date}</td>
                    <td className="p-2 border text-center">{a.check_in ? format(new Date(a.check_in), "HH:mm") : "-"}</td>
                    <td className="p-2 border text-center">{a.check_out ? format(new Date(a.check_out), "HH:mm") : "-"}</td>
                    <td className="p-2 border text-center">{a.total_hours ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Link href="/dashboard" className="block text-blue-600 hover:underline text-center mt-4">Back to Dashboard</Link>
        </div>
      </div>
    </ProtectedRoute>
  );
} 
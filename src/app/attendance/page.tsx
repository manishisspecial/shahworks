// Requires: npm install --save date-fns @types/date-fns
"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  total_hours: number | null;
  status: string;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const employee_id = typeof window !== "undefined" ? localStorage.getItem("employee_id") : null;

  useEffect(() => {
    if (!employee_id) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("attendance")
        .select("id, date, check_in, check_out, total_hours, status")
        .eq("employee_id", employee_id)
        .order("date", { ascending: false });
      setRecords(data || []);
      setLoading(false);
    })();
  }, [employee_id, submitting]);

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find(r => r.date === today);

  const handleCheckIn = async () => {
    setSubmitting(true);
    setError(null);
    const now = new Date().toISOString();
    const { error } = await supabase.from("attendance").insert({
      employee_id,
      date: today,
      check_in: now,
      status: "present"
    });
    setSubmitting(false);
    if (error) setError(error.message);
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    setError(null);
    const now = new Date().toISOString();
    const { error } = await supabase.from("attendance").update({
      check_out: now,
      total_hours: todayRecord && todayRecord.check_in ? ((new Date(now).getTime() - new Date(todayRecord.check_in).getTime()) / 3600000).toFixed(2) : null
    }).eq("id", todayRecord?.id);
    setSubmitting(false);
    if (error) setError(error.message);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold text-center">Attendance</h1>
          {error && <div className="text-red-600 text-center mb-2">{error}</div>}
          <div className="mb-6 flex gap-4 justify-center">
            {!todayRecord ? (
              <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700" onClick={handleCheckIn} disabled={submitting}>Check In</button>
            ) : !todayRecord.check_out ? (
              <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700" onClick={handleCheckOut} disabled={submitting}>Check Out</button>
            ) : (
              <span className="text-green-700 font-semibold">Attendance completed for today</span>
            )}
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Check In</th>
                  <th className="p-2 text-left">Check Out</th>
                  <th className="p-2 text-left">Total Hours</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{r.date}</td>
                    <td className="p-2">{r.check_in ? new Date(r.check_in).toLocaleTimeString() : "-"}</td>
                    <td className="p-2">{r.check_out ? new Date(r.check_out).toLocaleTimeString() : "-"}</td>
                    <td className="p-2">{r.total_hours ?? "-"}</td>
                    <td className="p-2">{r.status}</td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-4">No attendance records found.</td></tr>
                )}
              </tbody>
            </table>
          )}
          <Link href="/dashboard" className="block text-blue-600 hover:underline text-center mt-4">Back to Dashboard</Link>
        </div>
      </div>
    </ProtectedRoute>
  );
} 
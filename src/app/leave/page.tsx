"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";

interface LeaveBalance {
  casual_leave_total: number;
  casual_leave_used: number;
  sick_leave_total: number;
  sick_leave_used: number;
  earned_leave_total: number;
  earned_leave_used: number;
}

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: string;
}

export default function LeavePage() {
  const { user } = useUser();
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: "casual", from: "", to: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: bal } = await supabase
        .from("leave_balance")
        .select("casual_leave_total, casual_leave_used, sick_leave_total, sick_leave_used, earned_leave_total, earned_leave_used")
        .eq("user_id", user.id)
        .order("year", { ascending: false })
        .limit(1)
        .single();
      setBalance(bal);
      const { data: reqs } = await supabase
        .from("leave_requests")
        .select("id, leave_type, start_date, end_date, days_requested, reason, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRequests(reqs || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const days = (new Date(form.to).getTime() - new Date(form.from).getTime()) / (1000 * 60 * 60 * 24) + 1;
    await supabase.from("leave_requests").insert({
      user_id: user.id,
      leave_type: form.type,
      start_date: form.from,
      end_date: form.to,
      days_requested: days,
      reason: form.reason,
    });
    setSubmitting(false);
    window.location.reload();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold text-center">Leave Management</h1>
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="font-semibold mb-2">Leave Balance</h2>
                {balance ? (
                  <div className="flex gap-4">
                    <div>Casual: {balance.casual_leave_total - balance.casual_leave_used}</div>
                    <div>Sick: {balance.sick_leave_total - balance.sick_leave_used}</div>
                    <div>Earned: {balance.earned_leave_total - balance.earned_leave_used}</div>
                  </div>
                ) : (
                  <div>No balance information available.</div>
                )}
              </div>
              <form className="mb-4 space-y-2" onSubmit={handleApply}>
                <h2 className="font-semibold">Apply for Leave</h2>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="earned">Earned</option>
                </select>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={form.from}
                  onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
                  required
                />
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={form.to}
                  onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                  required
                />
                <textarea
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Reason"
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  required
                />
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Applying..." : "Apply"}
                </button>
              </form>
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Type</th>
                    <th className="p-2 border">From</th>
                    <th className="p-2 border">To</th>
                    <th className="p-2 border">Days</th>
                    <th className="p-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((l) => (
                    <tr key={l.id}>
                      <td className="p-2 border text-center">{l.leave_type}</td>
                      <td className="p-2 border text-center">{l.start_date}</td>
                      <td className="p-2 border text-center">{l.end_date}</td>
                      <td className="p-2 border text-center">{l.days_requested}</td>
                      <td className="p-2 border text-center">{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <Link href="/dashboard" className="block text-blue-600 hover:underline text-center mt-4">Back to Dashboard</Link>
        </div>
      </div>
    </ProtectedRoute>
  );
} 
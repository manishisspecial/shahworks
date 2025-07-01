"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string;
  status: string;
}

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    leave_type: "casual",
    reason: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const employee_id = typeof window !== "undefined" ? localStorage.getItem("employee_id") : null;

  useEffect(() => {
    if (!employee_id) return;
    (async () => {
      const { data } = await supabase
        .from("leave_requests")
        .select("id, start_date, end_date, leave_type, reason, status")
        .eq("employee_id", employee_id)
        .order("start_date", { ascending: false });
      setRequests(data || []);
    })();
  }, [employee_id, submitting]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    if (!form.start_date || !form.end_date || !form.leave_type || !form.reason) {
      setError("All fields are required.");
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from("leave_requests").insert({
      employee_id,
      start_date: form.start_date,
      end_date: form.end_date,
      leave_type: form.leave_type,
      reason: form.reason,
      status: "pending"
    });
    setSubmitting(false);
    if (error) setError(error.message);
    else setForm({ start_date: "", end_date: "", leave_type: "casual", reason: "" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Leave Requests</h1>
        <form className="mb-4 space-y-2" onSubmit={handleApply}>
          <h2 className="font-semibold">Apply for Leave</h2>
          <select
            className="border rounded px-2 py-1 w-full"
            name="leave_type"
            value={form.leave_type}
            onChange={handleChange}
            required
          >
            <option value="casual">Casual</option>
            <option value="sick">Sick</option>
            <option value="earned">Earned</option>
          </select>
          <input
            type="date"
            className="border rounded px-2 py-1 w-full"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            className="border rounded px-2 py-1 w-full"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            required
          />
          <textarea
            className="border rounded px-2 py-1 w-full"
            name="reason"
            placeholder="Reason"
            value={form.reason}
            onChange={handleChange}
            required
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Applying..." : "Apply"}
          </button>
          {error && <div className="text-red-600 text-center mt-2">{error}</div>}
        </form>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">From</th>
              <th className="p-2 text-left">To</th>
              <th className="p-2 text-left">Reason</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-2 capitalize">{r.leave_type}</td>
                <td className="p-2">{r.start_date}</td>
                <td className="p-2">{r.end_date}</td>
                <td className="p-2">{r.reason}</td>
                <td className="p-2 capitalize">{r.status}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-400 py-4">No leave requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
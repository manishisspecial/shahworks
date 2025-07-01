"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Employee {
  id: string;
  name: string;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string;
  status: string;
}

interface LeaveRequestRow extends LeaveRequest {
  employee_name?: string;
}

export default function AdminLeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const company_id = typeof window !== "undefined" ? localStorage.getItem("company_id") : null;

  useEffect(() => {
    if (!company_id) return;
    setLoading(true);
    (async () => {
      // Get all employees for this company
      const { data: employeesData } = await supabase
        .from("employee")
        .select("id, name")
        .eq("company_id", company_id);
      const empMap: Record<string, string> = Object.fromEntries((employeesData || []).map((e: Employee) => [e.id, e.name]));
      // Get all leave requests for these employees
      const { data: reqs } = await supabase
        .from("leave_requests")
        .select("id, employee_id, start_date, end_date, leave_type, reason, status")
        .in("employee_id", Object.keys(empMap));
      // Attach employee name
      setRequests((reqs || []).map((r: LeaveRequest) => ({ ...r, employee_name: empMap[r.employee_id] })));
      setLoading(false);
    })();
  }, [company_id, actionLoading]);

  const handleAction = async (id: string, status: string, employee_id: string) => {
    setActionLoading(id + status);
    await supabase.from("leave_requests").update({ status }).eq("id", id);
    // Create notification for employee
    const notifTitle = "Leave Request Update";
    const notifMsg = status === "approved"
      ? "Your leave request has been approved."
      : "Your leave request has been rejected.";
    await supabase.from("notifications").insert({
      recipient_employee_id: employee_id,
      title: notifTitle,
      message: notifMsg
    });
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Leave Requests (Admin)</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Employee</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">From</th>
                <th className="p-2 text-left">To</th>
                <th className="p-2 text-left">Reason</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r: LeaveRequestRow) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{r.employee_name || r.employee_id}</td>
                  <td className="p-2 capitalize">{r.leave_type}</td>
                  <td className="p-2">{r.start_date}</td>
                  <td className="p-2">{r.end_date}</td>
                  <td className="p-2">{r.reason}</td>
                  <td className="p-2 capitalize">{r.status}</td>
                  <td className="p-2">
                    {r.status === "pending" && (
                      <>
                        <button className="bg-green-600 text-white px-3 py-1 rounded mr-2" onClick={() => handleAction(r.id, "approved", r.employee_id)} disabled={actionLoading === r.id + "approved"}>Approve</button>
                        <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => handleAction(r.id, "rejected", r.employee_id)} disabled={actionLoading === r.id + "rejected"}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-4">No leave requests found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 
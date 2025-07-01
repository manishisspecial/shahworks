"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface AttendanceRow {
  id: number;
  employee_id: number;
  date: string;
  status: string;
  total_hours: number | null;
  [key: string]: string | number | null;
}

interface LeaveRow {
  id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  [key: string]: string | number | null;
}

interface PayrollRow {
  id: number;
  employee_id: number;
  month: string;
  year: number;
  net_salary: number;
  [key: string]: string | number | null;
}

export default function AdminReportsPage() {
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [leave, setLeave] = useState<LeaveRow[]>([]);
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const company_id = typeof window !== "undefined" ? localStorage.getItem("company_id") : null;

  useEffect(() => {
    if (!company_id) return;
    setLoading(true);
    (async () => {
      // Get all employees
      const { data: empData } = await supabase
        .from("employee")
        .select("id, name, email")
        .eq("company_id", company_id);
      setEmployees(empData || []);
      const empIds = (empData || []).map((e: Employee) => e.id);
      // Attendance summary
      const { data: attData } = await supabase
        .from("attendance")
        .select("id, employee_id, date, status, total_hours")
        .in("employee_id", empIds);
      setAttendance(attData || []);
      // Leave summary
      const { data: leaveData } = await supabase
        .from("leave_requests")
        .select("id, employee_id, leave_type, start_date, end_date, status")
        .in("employee_id", empIds);
      setLeave(leaveData || []);
      // Payroll summary
      const { data: payData } = await supabase
        .from("salary_slips")
        .select("id, employee_id, month, year, net_salary")
        .in("employee_id", empIds);
      setPayroll(payData || []);
      setLoading(false);
    })();
  }, [company_id]);

  // Helper to get employee name
  const getEmpName = (id: string) => employees.find((e) => e.id === id)?.name || id;
  const getEmpEmail = (id: string) => employees.find((e) => e.id === id)?.email || "";

  // CSV download helpers
  const downloadCSV = <T extends Record<string, string | number | null>>(rows: T[], columns: string[], filename: string) => {
    const csv = [columns.join(",")].concat(
      rows.map(row => columns.map(col => row[col]).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Reports Dashboard</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {/* Attendance Summary */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Attendance Summary</h2>
                <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded" onClick={() => downloadCSV(attendance, ["employee_id","date","status","total_hours"], "attendance.csv")}>Download CSV</button>
              </div>
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Employee</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a: AttendanceRow, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2">{getEmpName(a.employee_id.toString())}</td>
                      <td className="p-2">{getEmpEmail(a.employee_id.toString())}</td>
                      <td className="p-2">{a.date}</td>
                      <td className="p-2">{a.status}</td>
                      <td className="p-2">{a.total_hours ?? "-"}</td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-4">No attendance records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Leave Summary */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Leave Summary</h2>
                <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded" onClick={() => downloadCSV(leave, ["employee_id","leave_type","start_date","end_date","status"], "leave.csv")}>Download CSV</button>
              </div>
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Employee</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">From</th>
                    <th className="p-2 text-left">To</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leave.map((l: LeaveRow, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2">{getEmpName(l.employee_id.toString())}</td>
                      <td className="p-2">{getEmpEmail(l.employee_id.toString())}</td>
                      <td className="p-2 capitalize">{l.leave_type}</td>
                      <td className="p-2">{l.start_date}</td>
                      <td className="p-2">{l.end_date}</td>
                      <td className="p-2 capitalize">{l.status}</td>
                    </tr>
                  ))}
                  {leave.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-gray-400 py-4">No leave records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Payroll Summary */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Payroll Summary</h2>
                <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded" onClick={() => downloadCSV(payroll, ["employee_id","month","year","net_salary"], "payroll.csv")}>Download CSV</button>
              </div>
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Employee</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Month</th>
                    <th className="p-2 text-left">Year</th>
                    <th className="p-2 text-left">Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map((p: PayrollRow, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2">{getEmpName(p.employee_id.toString())}</td>
                      <td className="p-2">{getEmpEmail(p.employee_id.toString())}</td>
                      <td className="p-2">{p.month}</td>
                      <td className="p-2">{p.year}</td>
                      <td className="p-2 font-bold">₹{p.net_salary?.toLocaleString()}</td>
                    </tr>
                  ))}
                  {payroll.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-4">No payroll records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 
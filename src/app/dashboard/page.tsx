"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";
import { FaUserCheck, FaCalendarPlus, FaFileInvoiceDollar, FaUserCircle } from 'react-icons/fa';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}
interface AttendanceRow {
  status: string;
}

const DEFAULT_WIDGETS = [
  "attendance",
  "leave-balance",
  "announcements",
  "quick-actions"
];

const ALL_WIDGETS = [
  { key: "attendance", label: "Attendance Summary" },
  { key: "leave-balance", label: "Leave Balance" },
  { key: "announcements", label: "Announcements" },
  { key: "quick-actions", label: "Quick Actions" },
  { key: "holidays", label: "Upcoming Holidays" },
  { key: "recent-payslips", label: "Recent Payslips" },
  { key: "custom-note", label: "Custom Note" }
];

export default function DashboardPage() {
  const { user, companyId, company, loading, role } = useUser();
  const router = useRouter();
  const [widgets, setWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [attendance, setAttendance] = useState<{ present: number; absent: number }>({ present: 0, absent: 0 });
  const [leaveBalance, setLeaveBalance] = useState<{ casual: number; sick: number; earned: number }>({ casual: 0, sick: 0, earned: 0 });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [addEmpLoading, setAddEmpLoading] = useState(false);
  const [addEmpError, setAddEmpError] = useState<string | null>(null);
  const [addEmpSuccess, setAddEmpSuccess] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    position: "",
    employee_id: "",
    hire_date: "",
    salary: "",
    role: "employee",
    phone: "",
    address: ""
  });

  useEffect(() => {
    if (!loading && role === "admin") {
      router.replace("/admin/dashboard");
    }
  }, [role, loading, router]);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("attendance")
        .select("status")
        .eq("user_id", user.id)
        .gte("date", monthStart.toISOString().slice(0, 10));
      const present = (data as AttendanceRow[] || []).filter((a) => a.status === "present").length;
      const absent = (data as AttendanceRow[] || []).filter((a) => a.status === "absent").length;
      setAttendance({ present, absent });
    })();
  }, [user, loading]);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const { data } = await supabase
        .from("leave_balance")
        .select("casual_leave_total, casual_leave_used, sick_leave_total, sick_leave_used, earned_leave_total, earned_leave_used")
        .eq("user_id", user.id)
        .order("year", { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setLeaveBalance({
          casual: data.casual_leave_total - data.casual_leave_used,
          sick: data.sick_leave_total - data.sick_leave_used,
          earned: data.earned_leave_total - data.earned_leave_used
        });
      }
    })();
  }, [user, loading]);

  useEffect(() => {
    if (loading) return;
    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, content, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(2);
      setAnnouncements((data as Announcement[]) || []);
    })();
  }, [loading]);

  // Show loading spinner while user state is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-600 text-lg mb-4">Your organization is missing. Please complete onboarding or contact support.</div>
        <Link href="/onboarding">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold">Complete Onboarding</button>
        </Link>
      </div>
    );
  }

  // Widget add/remove logic
  const handleAddWidget = (key: string) => {
    setWidgets((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setShowAddWidget(false);
  };
  const handleRemoveWidget = (key: string) => {
    setWidgets((prev) => prev.filter((w) => w !== key));
  };

  const handleEmpFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEmpForm({ ...empForm, [e.target.name]: e.target.value });
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddEmpLoading(true);
    setAddEmpError(null);
    setAddEmpSuccess(null);
    try {
      const res = await fetch("/api/invite-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...empForm,
          salary: parseFloat(empForm.salary),
          company_id: company?.id || companyId || ""
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add employee");
      setAddEmpSuccess("Employee invited successfully! They will receive an email to complete registration.");
      setEmpForm({
        first_name: "",
        last_name: "",
        email: "",
        department: "",
        position: "",
        employee_id: "",
        hire_date: "",
        salary: "",
        role: "employee",
        phone: "",
        address: ""
      });
    } catch (err: unknown) {
      setAddEmpError((err as { message?: string }).message || "Failed to add employee");
    } finally {
      setAddEmpLoading(false);
    }
  };

  // Widget renderers
  const renderWidget = (key: string) => {
    switch (key) {
      case "attendance":
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-2 relative border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><FaUserCheck className="text-green-500 text-xl" /><h2 className="font-semibold text-xl">Attendance Summary</h2></div>
            <div className="flex gap-6 items-center">
              <div className="text-green-600 font-bold text-2xl">{attendance.present}</div>
              <div className="text-gray-500">Present</div>
              <div className="text-red-600 font-bold text-2xl ml-6">{attendance.absent}</div>
              <div className="text-gray-500">Absent</div>
            </div>
          </div>
        );
      case "leave-balance":
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-2 relative border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><FaCalendarPlus className="text-yellow-500 text-xl" /><h2 className="font-semibold text-xl">Leave Balance</h2></div>
            <div className="flex gap-6">
              <div className="text-blue-600 font-bold">Casual: {leaveBalance.casual}</div>
              <div className="text-yellow-600 font-bold">Sick: {leaveBalance.sick}</div>
              <div className="text-purple-600 font-bold">Earned: {leaveBalance.earned}</div>
            </div>
          </div>
        );
      case "announcements":
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-2 relative border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><FaUserCircle className="text-blue-400 text-xl" /><h2 className="font-semibold text-xl">Latest Announcements</h2></div>
            <div className="text-gray-500">{announcements.length === 0 ? 'No announcements.' : announcements.map(a => <div key={a.id}>{a.title}</div>)}</div>
          </div>
        );
      case "quick-actions":
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><FaFileInvoiceDollar className="text-purple-500 text-xl" /><h2 className="font-semibold text-xl">Quick Actions</h2></div>
            <div className="flex flex-col gap-3">
              <button className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-2 px-4 rounded-lg transition text-left">Check Attendance</button>
              <button className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold py-2 px-4 rounded-lg transition text-left">Apply Leave</button>
              <button className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold py-2 px-4 rounded-lg transition text-left">Download Salary Slip</button>
              <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded-lg transition text-left">View Profile</button>
            </div>
          </div>
        );
      case "holidays":
        return (
          <div className="bg-white rounded shadow p-6 flex flex-col gap-2 relative">
            <WidgetMenu onRemove={() => handleRemoveWidget("holidays")} />
            <h2 className="font-semibold text-lg mb-2">Upcoming Holidays</h2>
            <UpcomingHolidays />
          </div>
        );
      case "recent-payslips":
        return (
          <div className="bg-white rounded shadow p-6 flex flex-col gap-2 relative">
            <WidgetMenu onRemove={() => handleRemoveWidget("recent-payslips")} />
            <h2 className="font-semibold text-lg mb-2">Recent Payslips</h2>
            <RecentPayslips userId={user?.id ?? ''} />
          </div>
        );
      case "custom-note":
        return (
          <div className="bg-white rounded shadow p-6 flex flex-col gap-2 relative">
            <WidgetMenu onRemove={() => handleRemoveWidget("custom-note")} />
            <h2 className="font-semibold text-lg mb-2">Custom Note</h2>
            <CustomNote userId={user?.id ?? ''} />
          </div>
        );
      default:
        return null;
    }
  };

  // Widget picker modal
  const availableWidgets = ALL_WIDGETS.filter(w => !widgets.includes(w.key));

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8 px-2">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 text-center">Welcome to PeoplePulse HR</h1>
          <div className="text-lg text-gray-500 mb-8 text-center">Shah Works</div>
          <div className="flex justify-end gap-4 mb-6">
            <button onClick={() => setShowAddWidget(true)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-sm transition">+ Add Widget</button>
            <button onClick={() => setShowAddEmployee(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition">+ Add Employee</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {widgets.map((key) => (
              <div key={key}>{renderWidget(key)}</div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add more modern widgets or sections here if needed */}
          </div>
        </div>
      </div>
      <Modal isOpen={showAddWidget} onClose={() => setShowAddWidget(false)} title="Add Widget">
        <div className="space-y-4">
          {availableWidgets.length === 0 ? (
            <div className="text-gray-500 text-center">All widgets are already added.</div>
          ) : (
            availableWidgets.map(w => (
              <button
                key={w.key}
                className="w-full bg-blue-100 text-blue-800 px-4 py-2 rounded hover:bg-blue-200 font-semibold mb-2"
                onClick={() => handleAddWidget(w.key)}
              >
                {w.label}
              </button>
            ))
          )}
        </div>
      </Modal>
      <Modal isOpen={showAddEmployee} onClose={() => { setShowAddEmployee(false); setAddEmpError(null); setAddEmpSuccess(null); }} title="Add Employee">
        {!(company?.id || companyId) ? (
          <div className="text-center text-gray-500 py-8">Loading company information...</div>
        ) : (
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              name="first_name"
              placeholder="First Name"
              value={empForm.first_name}
              onChange={handleEmpFormChange}
              className="w-1/2 px-3 py-2 border rounded focus:outline-none focus:ring"
              required
            />
            <input
              type="text"
              name="last_name"
              placeholder="Last Name"
              value={empForm.last_name}
              onChange={handleEmpFormChange}
              className="w-1/2 px-3 py-2 border rounded focus:outline-none focus:ring"
              required
            />
          </div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={empForm.email}
            onChange={handleEmpFormChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
            required
          />
          <div className="flex gap-2">
            <input
              type="text"
              name="employee_id"
              placeholder="Employee ID"
              value={empForm.employee_id}
              onChange={handleEmpFormChange}
              className="w-1/2 px-3 py-2 border rounded focus:outline-none focus:ring"
              required
            />
            <input
              type="text"
              name="department"
              placeholder="Department"
              value={empForm.department}
              onChange={handleEmpFormChange}
              className="w-1/2 px-3 py-2 border rounded focus:outline-none focus:ring"
              required
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              name="position"
              placeholder="Position"
              value={empForm.position}
              onChange={handleEmpFormChange}
              className="w-1/2 px-3 py-2 border rounded focus:outline-none focus:ring"
              required
            />
            <input
              type="date"
              name="hire_date"
              placeholder="Hire Date"
              value={empForm.hire_date}
              onChange={handleEmpFormChange}
              className="w-1/2 px-3 py-2 border rounded focus:outline-none focus:ring"
              required
            />
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              name="salary"
              placeholder="Salary"
              value={empForm.salary}
              onChange={handleEmpFormChange}
              className="w-1/2 px-3 py-2 border rounded focus:outline-none focus:ring"
              required
              min="0"
              step="0.01"
            />
            <select
              name="role"
              value={empForm.role}
              onChange={handleEmpFormChange}
              className="w-1/2 px-3 py-2 border rounded focus:outline-none focus:ring"
              required
            >
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
            </select>
          </div>
          <input
            type="tel"
            name="phone"
            placeholder="Phone (optional)"
            value={empForm.phone}
            onChange={handleEmpFormChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
          <input
            type="text"
            name="address"
            placeholder="Address (optional)"
            value={empForm.address}
            onChange={handleEmpFormChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
          {addEmpError && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{addEmpError}</div>}
          {addEmpSuccess && <div className="text-green-700 text-sm bg-green-50 p-2 rounded">{addEmpSuccess}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold"
            disabled={addEmpLoading || !(company?.id || companyId)}
          >
            {addEmpLoading ? "Inviting..." : "Invite Employee"}
          </button>
        </form>
        )}
      </Modal>
    </ProtectedRoute>
  );
}

function WidgetMenu({ onRemove }: { onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute top-2 right-2 z-10">
      <button
        className="text-gray-400 hover:text-gray-700 text-xl px-2"
        onClick={() => setOpen((v) => !v)}
        title="Widget Options"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg w-32">
          <button
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded"
            onClick={() => { onRemove(); setOpen(false); }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function UpcomingHolidays() {
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([]);
  useEffect(() => {
    // Try to fetch from 'holidays' table, else use mock data
    (async () => {
      let data = null;
      try {
        const res = await supabase.from('holidays').select('date, name').order('date', { ascending: true });
        data = res.data;
      } catch {}
      setHolidays(data && data.length > 0 ? data : [
        { date: '2024-08-15', name: 'Independence Day' },
        { date: '2024-10-02', name: 'Gandhi Jayanti' },
        { date: '2024-12-25', name: 'Christmas' },
      ]);
    })();
  }, []);
  return (
    <ul className="text-sm text-gray-700">
      {holidays.map((h, i) => (
        <li key={i} className="mb-1"><span className="font-semibold">{h.name}</span> - {new Date(h.date).toLocaleDateString()}</li>
      ))}
    </ul>
  );
}

interface Payslip {
  month: number;
  year: number;
  net_salary: number;
  generated_at: string;
}

function RecentPayslips({ userId }: { userId: string }) {
  const [slips, setSlips] = useState<Payslip[]>([]);
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('salary_slips')
        .select('month, year, net_salary, generated_at')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(3);
      setSlips((data as Payslip[]) || []);
    })();
  }, [userId]);
  if (!userId) return null;
  return (
    <ul className="text-sm text-gray-700">
      {slips.length === 0 ? <li>No payslips found.</li> : slips.map((s, i) => (
        <li key={i} className="mb-1">{s.month}/{s.year} - ₹{s.net_salary} <span className="text-xs text-gray-400">({new Date(s.generated_at).toLocaleDateString()})</span></li>
      ))}
    </ul>
  );
}

function CustomNote({ userId }: { userId: string }) {
  const [note, setNote] = useState<string>('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    // Optionally fetch from DB if you have a notes table
    setSaved(false);
  }, [userId]);
  return (
    <div>
      <textarea
        className="w-full border rounded p-2 mb-2"
        rows={3}
        placeholder="Write your note..."
        value={note}
        onChange={e => { setNote(e.target.value); setSaved(false); }}
      />
      <button
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        onClick={() => setSaved(true)}
        type="button"
      >Save</button>
      {saved && <span className="ml-2 text-green-600">Saved!</span>}
    </div>
  );
} 
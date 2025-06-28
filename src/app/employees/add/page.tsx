"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const ROLES = ["employee", "hr", "admin"];

type Manager = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
};

export default function AddEmployeePage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    position: "",
    employee_id: "",
    role: "employee",
    manager_id: "",
    hire_date: "",
    salary: "",
    phone: "",
    address: ""
  });
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch existing employees for manager dropdown
    (async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, role")
        .in("role", ["hr", "admin"]);
      setManagers(data || []);
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    // Call API route to invite employee
    const res = await fetch("/api/invite-employee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const result = await res.json();
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        department: "",
        position: "",
        employee_id: "",
        role: "employee",
        manager_id: "",
        hire_date: "",
        salary: "",
        phone: "",
        address: ""
      });
    } else {
      setError(result.error || "Failed to invite employee.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-xl space-y-6"
      >
        <h1 className="text-2xl font-bold text-center mb-2">Add Employee</h1>
        {error && <div className="text-red-600 text-center">{error}</div>}
        {success && <div className="text-green-600 text-center">Employee invited successfully!</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" required />
          <input type="text" name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" required />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" required />
          <input type="text" name="employee_id" placeholder="Employee ID" value={form.employee_id} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" required />
          <input type="text" name="department" placeholder="Department" value={form.department} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" required />
          <input type="text" name="position" placeholder="Position" value={form.position} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" required />
          <select name="role" value={form.role} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" required>
            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <select name="manager_id" value={form.manager_id} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring">
            <option value="">Select Manager (optional)</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.role})</option>)}
          </select>
          <input type="date" name="hire_date" placeholder="Hire Date" value={form.hire_date} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" required />
          <input type="number" name="salary" placeholder="Salary" value={form.salary} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" required />
          <input type="text" name="phone" placeholder="Phone (optional)" value={form.phone} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" />
          <input type="text" name="address" placeholder="Address (optional)" value={form.address} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Inviting..." : "Invite Employee"}
        </button>
      </form>
    </div>
  );
} 
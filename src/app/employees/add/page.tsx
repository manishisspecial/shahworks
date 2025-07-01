"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AddEmployeePage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    position: "",
    department: "",
    date_of_joining: "",
    salary: "",
    is_admin: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    // You should get company_id from the logged-in admin's session or context
    const company_id = localStorage.getItem("company_id"); // Example: replace with your actual logic
    if (!company_id) {
      setError("Company ID not found. Please log in as admin.");
      setLoading(false);
      return;
    }
    const { error: empError } = await supabase.from("employee").insert({
      company_id,
      name: form.name,
      email: form.email,
      position: form.position,
      department: form.department,
      date_of_joining: form.date_of_joining,
      salary: form.salary ? parseFloat(form.salary) : null,
      is_admin: form.is_admin,
    });
    setLoading(false);
    if (empError) {
      setError(empError.message || "Failed to add employee.");
    } else {
      setSuccess(true);
      setForm({
        name: "",
        email: "",
        position: "",
        department: "",
        date_of_joining: "",
        salary: "",
        is_admin: false,
      });
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
        {success && <div className="text-green-600 text-center">Employee added successfully!</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" required />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" required />
          <input type="text" name="position" placeholder="Position" value={form.position} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" />
          <input type="text" name="department" placeholder="Department" value={form.department} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" />
          <input type="date" name="date_of_joining" placeholder="Date of Joining" value={form.date_of_joining} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" />
          <input type="number" name="salary" placeholder="Salary" value={form.salary} onChange={handleChange} className="px-4 py-2 border rounded focus:outline-none focus:ring" min="0" step="0.01" />
          <label className="flex items-center col-span-2">
            <input type="checkbox" name="is_admin" checked={form.is_admin} onChange={handleChange} className="mr-2" />
            Is Admin
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Employee"}
        </button>
      </form>
    </div>
  );
} 
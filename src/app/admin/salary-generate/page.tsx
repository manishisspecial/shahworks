"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Employee {
  id: string;
  name: string;
}

interface SalaryForm {
  employee_id: string;
  month: number;
  year: number;
  basic_salary: string;
  allowances: string;
  deductions: string;
}

export default function AdminSalaryGeneratePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<SalaryForm>({
    employee_id: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basic_salary: "",
    allowances: "",
    deductions: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const company_id = typeof window !== "undefined" ? localStorage.getItem("company_id") : null;

  useEffect(() => {
    if (!company_id) return;
    (async () => {
      const { data } = await supabase
        .from("employee")
        .select("id, name")
        .eq("company_id", company_id);
      setEmployees((data as Employee[]) || []);
    })();
  }, [company_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    if (!form.employee_id || !form.month || !form.year || !form.basic_salary) {
      setError("All fields are required.");
      setSubmitting(false);
      return;
    }
    const net_salary =
      parseFloat(form.basic_salary) +
      (form.allowances ? parseFloat(form.allowances) : 0) -
      (form.deductions ? parseFloat(form.deductions) : 0);
    const { error } = await supabase.from("salary_slips").insert({
      employee_id: form.employee_id,
      month: form.month,
      year: form.year,
      basic_salary: parseFloat(form.basic_salary),
      allowances: form.allowances ? parseFloat(form.allowances) : 0,
      deductions: form.deductions ? parseFloat(form.deductions) : 0,
      net_salary,
    });
    // Create notification for employee
    await supabase.from("notifications").insert({
      recipient_employee_id: form.employee_id,
      title: "Salary Slip Generated",
      message: `Your salary slip for ${form.month}/${form.year} is now available.`
    });
    setSubmitting(false);
    if (error) setError(error.message);
    else setSuccess("Salary slip generated successfully!");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Generate Salary Slip</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select name="employee_id" value={form.employee_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
              <option value="">Select Employee</option>
              {employees.map((emp: Employee) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select name="month" value={form.month} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input type="number" name="year" value={form.year} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required min="2000" max="2100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
            <input type="number" name="basic_salary" value={form.basic_salary} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required min="0" step="0.01" />
          </div>
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowances</label>
              <input type="number" name="allowances" value={form.allowances} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" min="0" step="0.01" />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
              <input type="number" name="deductions" value={form.deductions} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" min="0" step="0.01" />
            </div>
          </div>
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold" disabled={submitting}>{submitting ? "Generating..." : "Generate Salary Slip"}</button>
        </form>
      </div>
    </div>
  );
} 
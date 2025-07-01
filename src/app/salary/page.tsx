"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface SalarySlip {
  id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  generated_at: string;
}

export default function SalaryPage() {
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const employee_id = typeof window !== "undefined" ? localStorage.getItem("employee_id") : null;

  useEffect(() => {
    if (!employee_id) return;
    (async () => {
      const { data } = await supabase
        .from("salary_slips")
        .select("id, month, year, basic_salary, allowances, deductions, net_salary, generated_at")
        .eq("employee_id", employee_id)
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      setSlips(data || []);
    })();
  }, [employee_id]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Salary Slips</h1>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Month</th>
              <th className="p-2 text-left">Year</th>
              <th className="p-2 text-left">Basic</th>
              <th className="p-2 text-left">Allowances</th>
              <th className="p-2 text-left">Deductions</th>
              <th className="p-2 text-left">Net Salary</th>
              <th className="p-2 text-left">Generated At</th>
            </tr>
          </thead>
          <tbody>
            {slips.map(slip => (
              <tr key={slip.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{slip.month}</td>
                <td className="p-2">{slip.year}</td>
                <td className="p-2">₹{slip.basic_salary.toLocaleString()}</td>
                <td className="p-2">₹{slip.allowances.toLocaleString()}</td>
                <td className="p-2">₹{slip.deductions.toLocaleString()}</td>
                <td className="p-2 font-bold">₹{slip.net_salary.toLocaleString()}</td>
                <td className="p-2">{new Date(slip.generated_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {slips.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-400 py-4">No salary slips found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
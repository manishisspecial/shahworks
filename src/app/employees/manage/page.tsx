"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  role: string;
};

export default function ManageEmployeesPage() {
  const { company, loading } = useUser();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    setLoadingEmployees(true);
    (async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, email, department, position, role")
        .eq("company_id", company.id);
      setEmployees(data || []);
      setLoadingEmployees(false);
    })();
  }, [company]);

  if (loading || loadingEmployees) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Manage Employees</h1>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Department</th>
              <th className="p-2 text-left">Position</th>
              <th className="p-2 text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{emp.first_name} {emp.last_name}</td>
                <td className="p-2">{emp.email}</td>
                <td className="p-2">{emp.department}</td>
                <td className="p-2">{emp.position}</td>
                <td className="p-2 capitalize">{emp.role}</td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-400 py-4">No employees found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
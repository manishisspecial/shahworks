"use client";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { useEffect } from "react";

export default function AdminDashboardPage() {
  const { role, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== "admin") {
      router.push("/dashboard");
    }
  }, [role, loading, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/organizations">
            <div className="bg-blue-100 hover:bg-blue-200 rounded-lg p-6 text-center cursor-pointer shadow transition">
              <div className="text-xl font-semibold mb-2">Manage Employees</div>
              <div className="text-gray-600">Add, edit, or remove employees</div>
            </div>
          </Link>
          <Link href="/admin/leave-requests">
            <div className="bg-green-100 hover:bg-green-200 rounded-lg p-6 text-center cursor-pointer shadow transition">
              <div className="text-xl font-semibold mb-2">Leave Requests</div>
              <div className="text-gray-600">Approve or reject leave applications</div>
            </div>
          </Link>
          <Link href="/admin/salary-generate">
            <div className="bg-yellow-100 hover:bg-yellow-200 rounded-lg p-6 text-center cursor-pointer shadow transition">
              <div className="text-xl font-semibold mb-2">Salary Generation</div>
              <div className="text-gray-600">Generate and manage salary slips</div>
            </div>
          </Link>
          <Link href="/admin/reports">
            <div className="bg-purple-100 hover:bg-purple-200 rounded-lg p-6 text-center cursor-pointer shadow transition">
              <div className="text-xl font-semibold mb-2">Reports</div>
              <div className="text-gray-600">View attendance, leave, and payroll reports</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 
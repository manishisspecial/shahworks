"use client";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { useEffect } from "react";
import { FaUsersCog, FaCalendarCheck, FaMoneyCheckAlt, FaChartBar } from 'react-icons/fa';

export default function AdminDashboardPage() {
  const { role, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== "admin") {
      router.push("/dashboard");
    }
  }, [role, loading, router]);

  // Show loading spinner while user state is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/admin/organizations">
            <div className="bg-blue-100 hover:bg-blue-200 rounded-2xl p-8 text-center cursor-pointer shadow-lg transition flex flex-col items-center border border-blue-200">
              <FaUsersCog className="text-4xl text-blue-500 mb-2" />
              <div className="text-2xl font-semibold mb-2">Manage Employees</div>
              <div className="text-gray-600">Add, edit, or remove employees</div>
            </div>
          </Link>
          <Link href="/admin/leave-requests">
            <div className="bg-green-100 hover:bg-green-200 rounded-2xl p-8 text-center cursor-pointer shadow-lg transition flex flex-col items-center border border-green-200">
              <FaCalendarCheck className="text-4xl text-green-500 mb-2" />
              <div className="text-2xl font-semibold mb-2">Leave Requests</div>
              <div className="text-gray-600">Approve or reject leave applications</div>
            </div>
          </Link>
          <Link href="/admin/salary-generate">
            <div className="bg-yellow-100 hover:bg-yellow-200 rounded-2xl p-8 text-center cursor-pointer shadow-lg transition flex flex-col items-center border border-yellow-200">
              <FaMoneyCheckAlt className="text-4xl text-yellow-500 mb-2" />
              <div className="text-2xl font-semibold mb-2">Salary Generation</div>
              <div className="text-gray-600">Generate and manage salary slips</div>
            </div>
          </Link>
          <Link href="/admin/reports">
            <div className="bg-purple-100 hover:bg-purple-200 rounded-2xl p-8 text-center cursor-pointer shadow-lg transition flex flex-col items-center border border-purple-200">
              <FaChartBar className="text-4xl text-purple-500 mb-2" />
              <div className="text-2xl font-semibold mb-2">Reports</div>
              <div className="text-gray-600">View attendance, leave, and payroll reports</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 
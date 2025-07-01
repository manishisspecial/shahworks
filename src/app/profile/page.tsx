"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  date_of_joining: string;
  salary: number;
  is_admin: boolean;
}

interface AdminProfile {
  id: string;
  company_name: string;
  admin_name: string;
  admin_email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  website: string;
  logo_url: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<EmployeeProfile | AdminProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const user_email = typeof window !== "undefined" ? localStorage.getItem("admin_email") : null;
  const employee_id = typeof window !== "undefined" ? localStorage.getItem("employee_id") : null;
  const company_id = typeof window !== "undefined" ? localStorage.getItem("company_id") : null;

  useEffect(() => {
    if (!user_email) return;
    setLoading(true);
    (async () => {
      // Check if user is admin
      if (company_id) {
        const { data: adminUser } = await supabase
          .from("admin_user")
          .select("*")
          .eq("id", company_id)
          .single();
        if (adminUser && adminUser.admin_email === user_email) {
          setIsAdmin(true);
          setProfile(adminUser);
          setLoading(false);
          return;
        }
      }
      // Otherwise, fetch employee profile
      if (employee_id) {
        const { data } = await supabase
          .from("employee")
          .select("id, name, email, position, department, date_of_joining, salary, is_admin")
          .eq("id", employee_id)
          .single();
        setProfile(data || null);
      }
      setLoading(false);
    })();
  }, [user_email, employee_id, company_id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">My Profile</h1>
        {profile ? (
          <div className="space-y-4">
            {isAdmin ? (
              <>
                {(() => { const admin = profile as AdminProfile; return <>
                  <div><span className="font-semibold">Company Name:</span> {admin.company_name}</div>
                  <div><span className="font-semibold">Admin Name:</span> {admin.admin_name}</div>
                  <div><span className="font-semibold">Admin Email:</span> {admin.admin_email}</div>
                  <div><span className="font-semibold">Address:</span> {admin.address}</div>
                  <div><span className="font-semibold">City:</span> {admin.city}</div>
                  <div><span className="font-semibold">State:</span> {admin.state}</div>
                  <div><span className="font-semibold">Pincode:</span> {admin.pincode}</div>
                  <div><span className="font-semibold">Website:</span> {admin.website}</div>
                  {admin.logo_url && (
                    <div><span className="font-semibold">Logo:</span> <Image src={admin.logo_url} alt="Logo" width={64} height={64} className="h-16 inline-block align-middle" /> </div>
                  )}
                  <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={() => router.push("/profile/edit")}>Edit Profile</button>
                </> })()}
              </>
            ) : (
              (() => {
                const emp = profile as EmployeeProfile;
                return <>
                  <div><span className="font-semibold">Name:</span> {emp.name}</div>
                  <div><span className="font-semibold">Email:</span> {emp.email}</div>
                  <div><span className="font-semibold">Position:</span> {emp.position || <span className="text-gray-400">N/A</span>}</div>
                  <div><span className="font-semibold">Department:</span> {emp.department || <span className="text-gray-400">N/A</span>}</div>
                  <div><span className="font-semibold">Date of Joining:</span> {emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString() : <span className="text-gray-400">N/A</span>}</div>
                  <div><span className="font-semibold">Salary:</span> {emp.salary ? `₹${emp.salary.toLocaleString()}` : <span className="text-gray-400">N/A</span>}</div>
                  <div><span className="font-semibold">Admin:</span> {emp.is_admin ? "Yes" : "No"}</div>
                </>;
              })()
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400">Profile not found.</div>
        )}
      </div>
    </div>
  );
} 
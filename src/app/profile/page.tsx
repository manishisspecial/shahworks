"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { FiUser, FiEdit2 } from "react-icons/fi";
import { Dialog } from "@headlessui/react";
import { Fragment } from "react";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  department: string;
  position: string;
  hire_date: string;
  salary: number;
  role: string;
  manager_id: string | null;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  company_id: string;
}

interface ManagerInfo {
  first_name: string;
  last_name: string;
  position: string;
}

export default function ProfilePage() {
  const { user, company, loading } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setProfile(data);
        setForm(data);
        if (data.manager_id) {
          const { data: managerData } = await supabase
            .from("user_profiles")
            .select("first_name, last_name, position")
            .eq("id", data.manager_id)
            .single();
          setManager(managerData);
        }
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [user]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setUpdateMsg(null);
    setUpdateError(null);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          address: form.address,
        })
        .eq("id", profile?.id);
      if (error) throw error;
      setUpdateMsg("Profile updated successfully.");
      setShowEditModal(false);
      setProfile({ ...profile!, ...form } as UserProfile);
    } catch (err) {
      const error = err as { message?: string };
      setUpdateError(error.message || "Failed to update profile.");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">Loading profile...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <div className="bg-white/90 p-8 rounded-2xl shadow-2xl w-full max-w-2xl space-y-8 border border-blue-100">
          <div className="flex flex-col items-center mb-4">
            <div className="relative">
              {company?.logo_url && !logoError ? (
                <img
                  src={company.logo_url}
                  alt={company.name + " logo"}
                  width={96}
                  height={96}
                  className="h-24 w-24 object-cover rounded-full border-4 border-blue-200 bg-white shadow-lg"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="h-24 w-24 flex items-center justify-center rounded-full border-4 border-blue-200 bg-blue-50 text-blue-600 text-5xl shadow-lg">
                  <FiUser />
                </div>
              )}
              <button
                type="button"
                className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-2 shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => setShowEditModal(true)}
                aria-label="Edit Profile"
              >
                <FiEdit2 size={18} />
              </button>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-4 mb-1">My Profile</h1>
            <div className="text-blue-700 text-lg font-semibold mb-2">{company?.name}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                <FiUser /> Personal Information
              </h2>
              <div className="space-y-2">
                <div><span className="font-semibold text-gray-700">First Name:</span> <span className="text-gray-900">{profile?.first_name || <span className="text-gray-400">N/A</span>}</span></div>
                <div><span className="font-semibold text-gray-700">Last Name:</span> <span className="text-gray-900">{profile?.last_name || <span className="text-gray-400">N/A</span>}</span></div>
                <div><span className="font-semibold text-gray-700">Email:</span> <span className="text-gray-900">{profile?.email || <span className="text-gray-400">N/A</span>}</span></div>
                <div><span className="font-semibold text-gray-700">Phone:</span> <span className="text-gray-900">{profile?.phone || <span className="text-gray-400">N/A</span>}</span></div>
                <div><span className="font-semibold text-gray-700">Address:</span> <span className="text-gray-900">{profile?.address || <span className="text-gray-400">N/A</span>}</span></div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-600 mb-4">Employment Details</h2>
              <div className="space-y-2">
                <div><span className="font-semibold text-gray-700">Department:</span> <span className="text-gray-900">{profile?.department || <span className="text-gray-400">N/A</span>}</span></div>
                <div><span className="font-semibold text-gray-700">Position:</span> <span className="text-gray-900">{profile?.position || <span className="text-gray-400">N/A</span>}</span></div>
                <div><span className="font-semibold text-gray-700">Hire Date:</span> <span className="text-gray-900">{profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString() : <span className="text-gray-400">N/A</span>}</span></div>
                <div><span className="font-semibold text-gray-700">Annual Salary:</span> <span className="text-green-700 font-semibold">{profile?.salary ? `₹${profile.salary.toLocaleString()}` : <span className="text-gray-400">N/A</span>}</span></div>
                <div><span className="font-semibold text-gray-700">Role:</span> <span className="text-gray-900 capitalize">{profile?.role || <span className="text-gray-400">N/A</span>}</span></div>
              </div>
            </div>
          </div>
          {manager && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-purple-600 mb-4">Manager</h2>
              <div className="space-y-2">
                <div><span className="font-semibold text-gray-700">Name:</span> <span className="text-gray-900">{manager.first_name} {manager.last_name}</span></div>
                <div><span className="font-semibold text-gray-700">Position:</span> <span className="text-gray-900">{manager.position}</span></div>
              </div>
            </div>
          )}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-gray-600 mb-4">Account Information</h2>
              <div className="space-y-2">
                <div><span className="font-semibold text-gray-700">Member Since:</span> <span className="text-gray-900">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : <span className="text-gray-400">N/A</span>}</span></div>
                <div><span className="font-semibold text-gray-700">Last Updated:</span> <span className="text-gray-900">{profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : <span className="text-gray-400">N/A</span>}</span></div>
              </div>
            </div>
          </div>
          {updateMsg && <div className="text-green-700 text-sm bg-green-50 p-2 rounded mt-4">{updateMsg}</div>}
          {updateError && <div className="text-red-600 text-sm bg-red-50 p-2 rounded mt-4">{updateError}</div>}
        </div>
        {/* Edit Profile Modal */}
        <Dialog as={Fragment} open={showEditModal} onClose={() => setShowEditModal(false)}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <Dialog.Panel className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-blue-100">
              <Dialog.Title className="text-2xl font-bold text-blue-700 mb-4">Edit Profile</Dialog.Title>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 font-semibold"
                    onClick={() => setShowEditModal(false)}
                    disabled={editLoading}
                  >Cancel</button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                    disabled={editLoading}
                  >{editLoading ? "Saving..." : "Save"}</button>
                </div>
              </form>
              {updateError && <div className="text-red-600 text-sm bg-red-50 p-2 rounded mt-4">{updateError}</div>}
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
} 
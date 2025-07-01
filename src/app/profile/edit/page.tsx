"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileEditPage() {
  const [form, setForm] = useState({
    name: "",
    position: "",
    department: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const employee_id = typeof window !== "undefined" ? localStorage.getItem("employee_id") : null;

  useEffect(() => {
    if (!employee_id) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("employee")
        .select("name, position, department, phone, address")
        .eq("id", employee_id)
        .single();
      if (data) setForm(data);
      setLoading(false);
    })();
  }, [employee_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase
      .from("employee")
      .update(form)
      .eq("id", employee_id);
    setSubmitting(false);
    if (error) setError(error.message);
    else setSuccess("Profile updated successfully!");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Edit Profile</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input type="text" name="position" value={form.position} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input type="text" name="department" value={form.department} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" name="phone" value={form.phone || ""} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" name="address" value={form.address || ""} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold" disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </form>
        )}
      </div>
    </div>
  );
} 
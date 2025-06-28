"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProtectedRoute from "@/components/ProtectedRoute";

interface OrphanedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  department: string;
  position: string;
  role: string;
  company_id: string;
}

export default function OrphanedUsersPage() {
  const [users, setUsers] = useState<OrphanedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchOrphanedUsers = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc('get_orphaned_users');
    if (error) {
      setError(error.message);
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('user_profiles').delete().eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      setUsers(users.filter(u => u.id !== id));
    }
    setDeletingId(null);
  };

  useEffect(() => {
    fetchOrphanedUsers();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-4xl space-y-6">
          <h1 className="text-2xl font-bold text-center">Orphaned Users</h1>
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-center text-green-600">No orphaned users found.</div>
          ) : (
            <table className="min-w-full border">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Employee ID</th>
                  <th className="border px-4 py-2">Department</th>
                  <th className="border px-4 py-2">Role</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="border px-4 py-2">{user.first_name} {user.last_name}</td>
                    <td className="border px-4 py-2">{user.email}</td>
                    <td className="border px-4 py-2">{user.employee_id}</td>
                    <td className="border px-4 py-2">{user.department}</td>
                    <td className="border px-4 py-2">{user.role}</td>
                    <td className="border px-4 py-2">
                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                        onClick={() => handleDelete(user.id)}
                        disabled={deletingId === user.id}
                      >
                        {deletingId === user.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 
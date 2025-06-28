"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

interface AnnouncementWithAuthor extends Omit<Announcement, 'author_name'> {
  author: {
    first_name: string;
    last_name: string;
  } | null;
}

export default function PoliciesPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          author:user_profiles(first_name, last_name)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        const announcementsWithAuthor = (data as AnnouncementWithAuthor[]).map((announcement) => ({
          ...announcement,
          author_name: announcement.author 
            ? `${announcement.author.first_name} ${announcement.author.last_name}`
            : "Unknown"
        }));
        setAnnouncements(announcementsWithAuthor);
      }
      setLoading(false);
    };
    fetchAnnouncements();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-4xl space-y-6">
          <h1 className="text-2xl font-bold text-center">Company Policies & Announcements</h1>
          
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <>
              {/* Company Policies Section */}
              <div className="border-b pb-6">
                <h2 className="text-xl font-semibold mb-4 text-blue-600">Company Policies</h2>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Attendance Policy</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Standard working hours: 9:00 AM - 6:00 PM</li>
                      <li>Check-in time: Before 9:15 AM</li>
                      <li>Check-out time: After 6:00 PM</li>
                      <li>Late arrival after 9:15 AM will be marked as late</li>
                      <li>Early departure before 6:00 PM requires prior approval</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Leave Policy</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>Casual Leave:</strong> 10 days per year</li>
                      <li><strong>Sick Leave:</strong> 7 days per year</li>
                      <li><strong>Earned Leave:</strong> 15 days per year</li>
                      <li>Leave applications must be submitted at least 3 days in advance</li>
                      <li>Emergency leave can be applied with immediate effect</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Dress Code Policy</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Business casual attire on weekdays</li>
                      <li>Formal wear on client meeting days</li>
                      <li>Casual Friday policy (jeans allowed)</li>
                      <li>No offensive or inappropriate clothing</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Work From Home Policy</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Maximum 2 days per week with prior approval</li>
                      <li>Must be available during working hours</li>
                      <li>Regular check-ins with manager required</li>
                      <li>Performance metrics apply to WFH days</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Announcements Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-green-600">Recent Announcements</h2>
                {announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div key={announcement.id} className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{announcement.title}</h3>
                          <span className="text-sm text-gray-500">
                            {new Date(announcement.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{announcement.content}</p>
                        <div className="text-sm text-gray-500">
                          Posted by: {announcement.author_name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    No announcements available at the moment.
                  </div>
                )}
              </div>
            </>
          )}
          
          <Link href="/dashboard" className="block text-blue-600 hover:underline text-center mt-6">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
} 
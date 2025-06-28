"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface SalarySlip {
  id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  days_present: number;
  days_absent: number;
  generated_at: string;
}

export default function SalaryPage() {
  const { user } = useUser();
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchSalarySlips = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("salary_slips")
        .select("*")
        .eq("user_id", user.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      
      if (!error && data) {
        setSalarySlips(data);
      }
      setLoading(false);
    };
    fetchSalarySlips();
  }, [user]);

  const downloadPDF = async (slip: SalarySlip) => {
    setDownloading(true);
    setSelectedSlip(slip);
    
    // Wait for the DOM to update
    setTimeout(async () => {
      const element = document.getElementById("salary-slip");
      if (element) {
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`salary-slip-${slip.month}-${slip.year}.pdf`);
      }
      setDownloading(false);
      setSelectedSlip(null);
    }, 100);
  };

  const getMonthName = (month: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[month - 1];
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-4xl space-y-6">
          <h1 className="text-2xl font-bold text-center">Salary Management</h1>
          
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salarySlips.map((slip) => (
                  <div key={slip.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <h3 className="font-semibold text-lg">
                      {getMonthName(slip.month)} {slip.year}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <div>Basic Salary: ₹{slip.basic_salary.toLocaleString()}</div>
                      <div>Allowances: ₹{slip.allowances.toLocaleString()}</div>
                      <div>Deductions: ₹{slip.deductions.toLocaleString()}</div>
                      <div className="font-semibold text-green-600">
                        Net Salary: ₹{slip.net_salary.toLocaleString()}
                      </div>
                      <div>Days Present: {slip.days_present}</div>
                      <div>Days Absent: {slip.days_absent}</div>
                    </div>
                    <button
                      onClick={() => downloadPDF(slip)}
                      disabled={downloading}
                      className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {downloading && selectedSlip?.id === slip.id ? "Downloading..." : "Download PDF"}
                    </button>
                  </div>
                ))}
              </div>
              
              {salarySlips.length === 0 && (
                <div className="text-center text-gray-500">
                  No salary slips available yet.
                </div>
              )}
            </>
          )}
          
          <Link href="/dashboard" className="block text-blue-600 hover:underline text-center mt-4">
            Back to Dashboard
          </Link>
        </div>

        {/* Hidden element for PDF generation */}
        {selectedSlip && (
          <div id="salary-slip" className="hidden">
            <div className="p-8 max-w-md mx-auto bg-white">
              <div className="text-center border-b pb-4 mb-4">
                <h1 className="text-2xl font-bold">COMPANY NAME</h1>
                <p className="text-gray-600">HR Solutions</p>
              </div>
              
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">SALARY SLIP</h2>
                <p><strong>Month:</strong> {getMonthName(selectedSlip.month)} {selectedSlip.year}</p>
                <p><strong>Employee ID:</strong> {user?.id}</p>
                <p><strong>Generated:</strong> {new Date(selectedSlip.generated_at).toLocaleDateString()}</p>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Earnings</h3>
                <div className="flex justify-between mb-1">
                  <span>Basic Salary:</span>
                  <span>₹{selectedSlip.basic_salary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Allowances:</span>
                  <span>₹{selectedSlip.allowances.toLocaleString()}</span>
                </div>
                
                <h3 className="font-semibold mb-2 mt-4">Deductions</h3>
                <div className="flex justify-between mb-1">
                  <span>Deductions:</span>
                  <span>₹{selectedSlip.deductions.toLocaleString()}</span>
                </div>
                
                <div className="border-t pt-2 mt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Net Salary:</span>
                    <span>₹{selectedSlip.net_salary.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="mt-4 text-sm">
                  <p><strong>Days Present:</strong> {selectedSlip.days_present}</p>
                  <p><strong>Days Absent:</strong> {selectedSlip.days_absent}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 
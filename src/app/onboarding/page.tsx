"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

interface OnboardingForm {
  companyName: string;
  adminName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  website: string;
  logo: File | null;
}

const cities = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Lucknow"
];
const states = [
  "Maharashtra", "Delhi", "Karnataka", "Telangana", "Gujarat", "Tamil Nadu", "West Bengal", "Rajasthan", "Uttar Pradesh"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Company/Admin, 2: Success
  const [form, setForm] = useState<OnboardingForm>({
    companyName: "",
    adminName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    website: "",
    logo: null,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!form.companyName) errors.companyName = "Company name is required.";
    if (!form.adminName) errors.adminName = "Admin name is required.";
    if (!form.address) errors.address = "Address is required.";
    if (!form.city) errors.city = "City is required.";
    if (!form.state) errors.state = "State is required.";
    if (!form.pincode) errors.pincode = "Pincode is required.";
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files && files[0] ? files[0] : null;
      setForm({ ...form, logo: file });
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setLogoPreview(null);
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleLogoDelete = () => {
    setForm({ ...form, logo: null });
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors).join(" "));
      return;
    }
    setSubmitting(true);
    try {
      // Get admin email from localStorage/session
      let adminEmail = "";
      if (typeof window !== "undefined") {
        adminEmail = localStorage.getItem("admin_email") || "";
      }
      if (!adminEmail) {
        setError("Admin email not found. Please register first.");
        setSubmitting(false);
        return;
      }
      let logo_url = null;
      if (form.logo) {
        const fileExt = form.logo.name.split('.').pop();
        const fileName = `logo_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('company-logos').upload(fileName, form.logo);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('company-logos').getPublicUrl(fileName);
        logo_url = publicUrlData.publicUrl;
      }
      // Create admin_user (company + admin)
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_user")
        .insert({
          company_name: form.companyName,
          admin_name: form.adminName,
          admin_email: adminEmail,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          website: form.website,
          logo_url,
        })
        .select()
        .single();
      if (adminError) throw adminError;
      // Set company_id in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("company_id", adminUser.id);
      }
      setStep(2);
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-green-600 text-4xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
          <p className="mb-6">Your company and admin account have been created. You can now log in.</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition" onClick={() => router.push("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">Company & Admin Setup</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
            <input type="text" name="companyName" value={form.companyName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name <span className="text-red-500">*</span></label>
            <input type="text" name="adminName" value={form.adminName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
            <input type="text" name="address" value={form.address} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
            <select name="city" value={form.city} onChange={handleSelectChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select City</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
            <select name="state" value={form.state} onChange={handleSelectChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select State</option>
              {states.map(state => <option key={state} value={state}>{state}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
            <input type="text" name="pincode" value={form.pincode} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input type="text" name="website" value={form.website} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
            <input ref={fileInputRef} type="file" name="logo" accept="image/*" onChange={handleInputChange} className="w-full" />
            {logoPreview && (
              <div className="mt-2 flex items-center space-x-2">
                <Image src={logoPreview} alt="Logo Preview" width={64} height={64} className="h-16 w-16 object-contain border rounded" />
                <button type="button" onClick={handleLogoDelete} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
              </div>
            )}
          </div>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold" disabled={submitting}>{submitting ? "Onboarding..." : "Complete Onboarding"}</button>
        </form>
      </div>
    </div>
  );
} 
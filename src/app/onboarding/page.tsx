"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import Image from "next/image";

interface OnboardingForm {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  logo: File | null;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  position: string;
  hireDate: string;
  salary: string;
  role: string;
}

interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

function OnboardingPageInner() {
  const { user, company, loading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1); // 1: Company, 2: Personal, 3: Review, 4: Success
  const [form, setForm] = useState<OnboardingForm>({
    companyName: searchParams.get('org') || '',
    companyEmail: '',
    companyPhone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    logo: null,
    firstName: '',
    lastName: '',
    employeeId: '',
    department: '',
    position: '',
    hireDate: '',
    salary: '',
    role: 'admin',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Robust onboarding check: if profile or company is missing/incomplete, force onboarding
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    
    if (!loading && user) {
      // Only redirect to dashboard if company is complete
      const isCompanyComplete = company && company.id && company.name;
      if (isCompanyComplete) {
        router.push('/dashboard');
      }
      // If user is authenticated but company is incomplete, stay on onboarding
    }
  }, [user, company, loading, router]);

  // Stepper/Progress Bar
  const steps = [
    { label: 'Company Info' },
    { label: 'Personal Info' },
    { label: 'Review & Complete' },
    { label: 'Success' }
  ];

  // Validation helpers
  const validateCompany = () => {
    const errors: {[key: string]: string} = {};
    if (!form.companyName) errors.companyName = 'Company name is required.';
    if (!form.companyEmail || !/^\S+@\S+\.\S+$/.test(form.companyEmail)) errors.companyEmail = 'Valid email required.';
    if (form.companyPhone && !/^\+?\d{7,15}$/.test(form.companyPhone)) errors.companyPhone = 'Valid phone required.';
    if (!form.address_line1) errors.address_line1 = 'Address Line 1 is required.';
    if (!form.city) errors.city = 'City is required.';
    if (!form.state) errors.state = 'State is required.';
    if (!form.pincode) errors.pincode = 'Pincode is required.';
    return errors;
  };
  const validatePersonal = () => {
    const errors: {[key: string]: string} = {};
    if (!form.firstName) errors.firstName = 'First name is required.';
    if (!form.lastName) errors.lastName = 'Last name is required.';
    if (!form.role) errors.role = 'Role is required.';
    if (form.role !== 'owner') {
      if (!form.employeeId) errors.employeeId = 'Employee ID is required.';
      if (!form.hireDate) errors.hireDate = 'Hire date is required.';
    }
    return errors;
  };

  // Navigation handlers
  const handleNext = () => {
    setError(null);
    let errors = {};
    if (step === 1) errors = validateCompany();
    if (step === 2) errors = validatePersonal();
    setFieldErrors(errors);
    if (Object.keys(errors).length === 0) setStep(step + 1);
  };
  const handleBack = () => {
    setError(null);
    setFieldErrors({});
    setStep(step - 1);
  };

  // Submission handler
  const handleComplete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let logo_url = null;
      if (form.logo) {
        const { data, error: uploadError } = await supabase.storage.from('company-logos').upload(`logos/${Date.now()}_${form.logo.name}`, form.logo);
        if (uploadError) throw uploadError;
        logo_url = supabase.storage.from('company-logos').getPublicUrl(data.path).data.publicUrl;
      }
      // Check for duplicate company name
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('name', form.companyName)
        .single();
      let companyId = existingCompany?.id;
      if (!companyId) {
        // Create company
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: form.companyName,
            email: form.companyEmail,
            phone: form.companyPhone,
            address_line1: form.address_line1,
            address_line2: form.address_line2,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            logo_url
          })
          .select()
          .single();
        if (companyError) throw companyError;
        companyId = newCompany.id;
      }
      // Upsert user profile (personal info only)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user?.id,
          email: user?.email,
          first_name: form.firstName,
          last_name: form.lastName,
          employee_id: form.employeeId ? form.employeeId : null,
          hire_date: form.hireDate ? form.hireDate : null,
          company_id: companyId
        }, { onConflict: 'id' });
      if (profileError) throw profileError;
      // Upsert user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user?.id,
          role: form.role,
          company_id: companyId
        }, { onConflict: 'user_id' });
      if (roleError) throw roleError;
      // Upsert leave balance
      const currentYear = new Date().getFullYear();
      await supabase
        .from('leave_balance')
        .upsert({
          user_id: user?.id,
          year: currentYear
        }, { onConflict: 'user_id,year' });
      setStep(4); // Success
    } catch (err: unknown) {
      const error = err as DatabaseError;
      setError(error.message || 'An error occurred. Please try again or contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Stepper/Progress Bar */}
          <div className="flex justify-center mb-8">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${
                  step === i + 1 ? 'bg-blue-600 text-white border-blue-600' : step > i + 1 ? 'bg-green-500 text-white border-green-500' : 'bg-gray-200 text-gray-600 border-gray-300'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                {i < steps.length - 1 && <div className="w-10 h-1 bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-center mb-8">Complete Your Setup</h1>
          {/* Step 1: Company Info */}
          {step === 1 && (
            <form onSubmit={e => { e.preventDefault(); handleNext(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                  <input type="text" name="companyName" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  {fieldErrors.companyName && <div className="text-red-500 text-xs mt-1">{fieldErrors.companyName}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Email <span className="text-red-500">*</span></label>
                  <input type="email" name="companyEmail" value={form.companyEmail} onChange={e => setForm({ ...form, companyEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  {fieldErrors.companyEmail && <div className="text-red-500 text-xs mt-1">{fieldErrors.companyEmail}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Phone</label>
                  <input type="tel" name="companyPhone" value={form.companyPhone} onChange={e => setForm({ ...form, companyPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {fieldErrors.companyPhone && <div className="text-red-500 text-xs mt-1">{fieldErrors.companyPhone}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setForm({ ...form, logo: file });
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setLogoPreview(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    } else {
                      setLogoPreview(null);
                    }
                  }} className="w-full" />
                  {logoPreview && (
                    <div className="flex items-center gap-2 mt-2">
                      <Image src={logoPreview} alt="Logo Preview" width={64} height={64} className="h-16 w-16 object-contain border rounded" />
                      <button type="button" aria-label="Remove logo" onClick={() => { setForm({ ...form, logo: null }); setLogoPreview(null); }} className="text-red-500 text-lg font-bold px-2" style={{ cursor: 'pointer' }}>×</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 <span className="text-red-500">*</span></label>
                  <input type="text" name="address_line1" value={form.address_line1} onChange={e => setForm({ ...form, address_line1: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input type="text" name="address_line2" value={form.address_line2} onChange={e => setForm({ ...form, address_line2: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                  <select name="city" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">Select City</option>
                    <option value="New Delhi">New Delhi</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Pune">Pune</option>
                    <option value="Jaipur">Jaipur</option>
                    <option value="Lucknow">Lucknow</option>
                    <option value="Kanpur">Kanpur</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Indore">Indore</option>
                    <option value="Thane">Thane</option>
                    <option value="Bhopal">Bhopal</option>
                    <option value="Visakhapatnam">Visakhapatnam</option>
                    <option value="Pimpri-Chinchwad">Pimpri-Chinchwad</option>
                    <option value="Patna">Patna</option>
                    <option value="Vadodara">Vadodara</option>
                    <option value="Ghaziabad">Ghaziabad</option>
                    <option value="Ludhiana">Ludhiana</option>
                    <option value="Agra">Agra</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Faridabad">Faridabad</option>
                    <option value="Meerut">Meerut</option>
                    <option value="Rajkot">Rajkot</option>
                    <option value="Kalyan-Dombivli">Kalyan-Dombivli</option>
                    <option value="Vasai-Virar">Vasai-Virar</option>
                    <option value="Varanasi">Varanasi</option>
                    <option value="Srinagar">Srinagar</option>
                    <option value="Aurangabad">Aurangabad</option>
                    <option value="Dhanbad">Dhanbad</option>
                    <option value="Amritsar">Amritsar</option>
                    <option value="Navi Mumbai">Navi Mumbai</option>
                    <option value="Allahabad">Allahabad</option>
                    <option value="Ranchi">Ranchi</option>
                    <option value="Howrah">Howrah</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Jabalpur">Jabalpur</option>
                    <option value="Gwalior">Gwalior</option>
                    <option value="Vijayawada">Vijayawada</option>
                    <option value="Jodhpur">Jodhpur</option>
                    <option value="Madurai">Madurai</option>
                    <option value="Raipur">Raipur</option>
                    <option value="Kota">Kota</option>
                    <option value="Guwahati">Guwahati</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Solapur">Solapur</option>
                    <option value="Hubli–Dharwad">Hubli–Dharwad</option>
                    <option value="Bareilly">Bareilly</option>
                    <option value="Moradabad">Moradabad</option>
                    <option value="Mysore">Mysore</option>
                    <option value="Gurgaon">Gurgaon</option>
                    <option value="Aligarh">Aligarh</option>
                    <option value="Jalandhar">Jalandhar</option>
                    <option value="Tiruchirappalli">Tiruchirappalli</option>
                    <option value="Bhubaneswar">Bhubaneswar</option>
                    <option value="Salem">Salem</option>
                    <option value="Mira-Bhayandar">Mira-Bhayandar</option>
                    <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                    <option value="Bhiwandi">Bhiwandi</option>
                    <option value="Saharanpur">Saharanpur</option>
                    <option value="Guntur">Guntur</option>
                    <option value="Amravati">Amravati</option>
                    <option value="Noida">Noida</option>
                    <option value="Jamshedpur">Jamshedpur</option>
                    <option value="Bhilai">Bhilai</option>
                    <option value="Cuttack">Cuttack</option>
                    <option value="Firozabad">Firozabad</option>
                    <option value="Kochi">Kochi</option>
                    <option value="Nellore">Nellore</option>
                    <option value="Bhavnagar">Bhavnagar</option>
                    <option value="Dehradun">Dehradun</option>
                    <option value="Durgapur">Durgapur</option>
                    <option value="Asansol">Asansol</option>
                    <option value="Rourkela">Rourkela</option>
                    <option value="Nanded">Nanded</option>
                    <option value="Kolhapur">Kolhapur</option>
                    <option value="Ajmer">Ajmer</option>
                    <option value="Akola">Akola</option>
                    <option value="Gulbarga">Gulbarga</option>
                    <option value="Jamnagar">Jamnagar</option>
                    <option value="Ujjain">Ujjain</option>
                    <option value="Loni">Loni</option>
                    <option value="Siliguri">Siliguri</option>
                    <option value="Jhansi">Jhansi</option>
                    <option value="Ulhasnagar">Ulhasnagar</option>
                    <option value="Jammu">Jammu</option>
                    <option value="Sangli-Miraj & Kupwad">Sangli-Miraj & Kupwad</option>
                    <option value="Mangalore">Mangalore</option>
                    <option value="Erode">Erode</option>
                    <option value="Belgaum">Belgaum</option>
                    <option value="Kurnool">Kurnool</option>
                    <option value="Ambattur">Ambattur</option>
                    <option value="Rajahmundry">Rajahmundry</option>
                    <option value="Tirupati">Tirupati</option>
                    <option value="Malegaon">Malegaon</option>
                    <option value="Gaya">Gaya</option>
                    <option value="Udaipur">Udaipur</option>
                    <option value="Maheshtala">Maheshtala</option>
                    <option value="Davanagere">Davanagere</option>
                    <option value="Kozhikode">Kozhikode</option>
                    <option value="Kurnool">Kurnool</option>
                    <option value="Rajpur Sonarpur">Rajpur Sonarpur</option>
                    <option value="Bokaro">Bokaro</option>
                    <option value="South Dumdum">South Dumdum</option>
                    <option value="Bellary">Bellary</option>
                    <option value="Patiala">Patiala</option>
                    <option value="Gopalpur">Gopalpur</option>
                    <option value="Agartala">Agartala</option>
                    <option value="Bhagalpur">Bhagalpur</option>
                    <option value="Muzaffarnagar">Muzaffarnagar</option>
                    <option value="Bhatpara">Bhatpara</option>
                    <option value="Panihati">Panihati</option>
                    <option value="Latur">Latur</option>
                    <option value="Dhule">Dhule</option>
                    <option value="Rohtak">Rohtak</option>
                    <option value="Korba">Korba</option>
                    <option value="Bhilwara">Bhilwara</option>
                    <option value="Berhampur">Berhampur</option>
                    <option value="Muzaffarpur">Muzaffarpur</option>
                    <option value="Ahmednagar">Ahmednagar</option>
                    <option value="Mathura">Mathura</option>
                    <option value="Kollam">Kollam</option>
                    <option value="Avadi">Avadi</option>
                    <option value="Kadapa">Kadapa</option>
                    <option value="Anantapur">Anantapur</option>
                    <option value="Kamarhati">Kamarhati</option>
                    <option value="Bilaspur">Bilaspur</option>
                    <option value="Sambalpur">Sambalpur</option>
                    <option value="Shahjahanpur">Shahjahanpur</option>
                    <option value="Satara">Satara</option>
                    <option value="Bijapur">Bijapur</option>
                    <option value="Rampur">Rampur</option>
                    <option value="Shimoga">Shimoga</option>
                    <option value="Chandrapur">Chandrapur</option>
                    <option value="Junagadh">Junagadh</option>
                    <option value="Thrissur">Thrissur</option>
                    <option value="Alwar">Alwar</option>
                    <option value="Bardhaman">Bardhaman</option>
                    <option value="Kulti">Kulti</option>
                    <option value="Nizamabad">Nizamabad</option>
                    <option value="Parbhani">Parbhani</option>
                    <option value="Tumkur">Tumkur</option>
                    <option value="Khammam">Khammam</option>
                    <option value="Ozhukarai">Ozhukarai</option>
                    <option value="Bihar Sharif">Bihar Sharif</option>
                    <option value="Panipat">Panipat</option>
                    <option value="Darbhanga">Darbhanga</option>
                    <option value="Bally">Bally</option>
                    <option value="Aizawl">Aizawl</option>
                    <option value="Dewas">Dewas</option>
                    <option value="Ichalkaranji">Ichalkaranji</option>
                    <option value="Karnal">Karnal</option>
                    <option value="Bathinda">Bathinda</option>
                    <option value="Jalna">Jalna</option>
                    <option value="Eluru">Eluru</option>
                    <option value="Barasat">Barasat</option>
                    <option value="Kirari Suleman Nagar">Kirari Suleman Nagar</option>
                    <option value="Purnia">Purnia</option>
                    <option value="Satna">Satna</option>
                    <option value="Mau">Mau</option>
                    <option value="Sonipat">Sonipat</option>
                    <option value="Farrukhabad">Farrukhabad</option>
                    <option value="Sagar">Sagar</option>
                    <option value="Rourkela Industrial Township">Rourkela Industrial Township</option>
                    <option value="Durg">Durg</option>
                    <option value="Imphal">Imphal</option>
                    <option value="Ratlam">Ratlam</option>
                    <option value="Hapur">Hapur</option>
                    <option value="Arrah">Arrah</option>
                    <option value="Karimnagar">Karimnagar</option>
                    <option value="Anantapuram">Anantapuram</option>
                    <option value="Etawah">Etawah</option>
                    <option value="Ambarnath">Ambarnath</option>
                    <option value="North Dumdum">North Dumdum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                  <select name="state" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">Select State</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Puducherry">Puducherry</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                    <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                    <option value="Lakshadweep">Lakshadweep</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
                  <input type="text" name="pincode" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">Next</button>
              </div>
            </form>
          )}
          {/* Step 2: Personal Info */}
          {step === 2 && (
            <form onSubmit={e => { e.preventDefault(); handleNext(); }}>
              <h1 className="text-3xl font-bold text-center mb-8">Complete Your Setup with Admin Details</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                  <select name="role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input type="text" name="firstName" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  {fieldErrors.firstName && <div className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" name="lastName" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  {fieldErrors.lastName && <div className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</div>}
                </div>
                {form.role !== 'owner' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID <span className="text-red-500">*</span></label>
                      <input type="text" name="employeeId" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required={form.role !== 'owner'} />
                      {fieldErrors.employeeId && <div className="text-red-500 text-xs mt-1">{fieldErrors.employeeId}</div>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date <span className="text-red-500">*</span></label>
                      <input type="date" name="hireDate" value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required={form.role !== 'owner'} />
                      {fieldErrors.hireDate && <div className="text-red-500 text-xs mt-1">{fieldErrors.hireDate}</div>}
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" onClick={handleBack} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition">Back</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">Next</button>
              </div>
            </form>
          )}
          {/* Step 3: Review & Complete */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Review & Confirm</h2>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Company Info</h3>
                <ul className="text-gray-700 text-sm mb-4">
                  <li><b>Name:</b> {form.companyName}</li>
                  <li><b>Email:</b> {form.companyEmail}</li>
                  <li><b>Phone:</b> {form.companyPhone}</li>
                  <li><b>Address:</b> {form.address_line1}, {form.address_line2}, {form.city}, {form.state}, {form.pincode}</li>
                </ul>
                <h3 className="font-semibold mb-2">Personal Info</h3>
                <ul className="text-gray-700 text-sm">
                  <li><b>First Name:</b> {form.firstName}</li>
                  <li><b>Last Name:</b> {form.lastName}</li>
                  <li><b>Employee ID:</b> {form.employeeId}</li>
                  <li><b>Role:</b> {form.role === 'owner' ? 'Owner' : form.role === 'admin' ? 'Admin' : 'HR'}</li>
                  <li><b>Joining Date:</b> {form.hireDate}</li>
                </ul>
              </div>
              {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
              <div className="flex justify-between mt-6">
                <button type="button" onClick={handleBack} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition">Back</button>
                <button type="button" onClick={handleComplete} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition" disabled={submitting}>{submitting ? 'Completing...' : 'Complete Onboarding'}</button>
              </div>
            </div>
          )}
          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center">
              <div className="text-green-600 text-4xl mb-4">✓</div>
              <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
              <p className="mb-6">Your company and profile have been set up. You can now use PeoplePulse HR.</p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition" onClick={() => router.push('/dashboard')}>Go to Dashboard</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingPageInner />
    </Suspense>
  );
} 
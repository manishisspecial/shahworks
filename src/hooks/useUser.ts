import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminUser {
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

export interface UserProfile {
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
  manager_id?: string;
  phone?: string;
  address?: string;
  company_id: string;
  company?: Company;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'employee' | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ?? null);
      let localCompanyId = null;
      if (typeof window !== "undefined") {
        localCompanyId = localStorage.getItem("company_id");
      }
      setCompanyId(localCompanyId);
      if (localCompanyId) {
        const { data: adminUser } = await supabase
          .from('admin_user')
          .select('*')
          .eq('id', localCompanyId)
          .single();
        setCompany(adminUser ?? null);
        if (user && adminUser && user.email === adminUser.admin_email) {
          setRole('admin');
        } else {
          setRole('employee');
        }
      } else {
        setCompany(null);
        setRole(null);
      }
      setLoading(false);
    };
    fetchUser();
    // No need for auth state change for company info
  }, []);

  return { user, role, companyId, company, loading };
} 
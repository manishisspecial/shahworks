import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

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
  const [role, setRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ?? null);
      if (user) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('company_id, role')
          .eq('user_id', user.id)
          .single();
        setRole(userRole?.role ?? null);
        setCompanyId(userRole?.company_id ?? null);
        if (userRole?.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('id', userRole.company_id)
            .single();
          setCompany(company ?? null);
        } else {
          setCompany(null);
        }
      } else {
        setRole(null);
        setCompanyId(null);
        setCompany(null);
      }
      setLoading(false);
    };
    fetchUser();
    const { data: listener } = supabase.auth.onAuthStateChange((
      _event: AuthChangeEvent,
      session: Session | null
    ) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('company_id, role')
          .eq('user_id', session.user.id)
          .single()
          .then(async ({ data: userRole }) => {
            setRole(userRole?.role ?? null);
            setCompanyId(userRole?.company_id ?? null);
            if (userRole?.company_id) {
              const { data: company } = await supabase
                .from('companies')
                .select('*')
                .eq('id', userRole.company_id)
                .single();
              setCompany(company ?? null);
            } else {
              setCompany(null);
            }
          });
      } else {
        setRole(null);
        setCompanyId(null);
        setCompany(null);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, role, companyId, company, loading };
} 
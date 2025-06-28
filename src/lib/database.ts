import { supabase } from './supabaseClient';

export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
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
  role: 'employee' | 'hr' | 'admin';
  company_id: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface Attendance {
  id: string;
  user_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  total_hours?: number;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: 'casual' | 'sick' | 'earned';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveBalance {
  id: string;
  user_id: string;
  year: number;
  casual_leave_total: number;
  casual_leave_used: number;
  sick_leave_total: number;
  sick_leave_used: number;
  earned_leave_total: number;
  earned_leave_used: number;
  created_at?: string;
  updated_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  company_id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SalarySlip {
  id: string;
  user_id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  days_present: number;
  days_absent: number;
  generated_at?: string;
}

export class DatabaseService {
  // User Profile Operations
  static async createUserProfile(profile: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    employee_id: string;
    department: string;
    position: string;
    hire_date: string;
    salary: number;
    role: 'employee' | 'hr' | 'admin';
    company_id: string;
    phone?: string;
    address?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profile)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*, company:companies(*)')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  // Company Operations
  static async createCompany(company: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    logo_url?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert(company)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async getCompany(companyId: string, includeInactive = false) {
    try {
      let query = supabase
        .from('companies')
        .select('*')
        .eq('id', companyId);
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query.single();
      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async listCompanies(includeInactive = false) {
    try {
      let query = supabase
        .from('companies')
        .select('*');
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async softDeleteCompany(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ is_active: false })
        .eq('id', companyId)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async restoreCompany(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ is_active: true })
        .eq('id', companyId)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  // Attendance Operations
  static async checkIn(userId: string) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      // Check if already checked in today
      const { data: existing } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (existing) {
        return { data: null, error: { message: 'Already checked in today' } };
      }

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          user_id: userId,
          date: today,
          check_in: new Date().toISOString(),
          status: 'present'
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async checkOut(userId: string) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      const { data, error } = await supabase
        .from('attendance')
        .update({
          check_out: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('date', today)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async getAttendance(userId: string, startDate?: string, endDate?: string) {
    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  // Leave Operations
  static async createLeaveRequest(request: {
    user_id: string;
    leave_type: 'casual' | 'sick' | 'earned';
    start_date: string;
    end_date: string;
    days_requested: number;
    reason: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async getLeaveRequests(userId?: string, status?: string) {
    try {
      let query = supabase
        .from('leave_requests')
        .select('*, user:user_profiles(first_name, last_name, employee_id)')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async updateLeaveRequest(requestId: string, updates: {
    status: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          ...updates,
          approved_at: updates.status !== 'pending' ? new Date().toISOString() : null
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  // Leave Balance Operations
  static async getLeaveBalance(userId: string, year?: number) {
    try {
      const currentYear = year || new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('leave_balance')
        .select('*')
        .eq('user_id', userId)
        .eq('year', currentYear)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async createLeaveBalance(userId: string, year?: number) {
    try {
      const currentYear = year || new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('leave_balance')
        .insert({
          user_id: userId,
          year: currentYear
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  // Announcement Operations
  static async createAnnouncement(announcement: {
    title: string;
    content: string;
    author_id: string;
    company_id: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert(announcement)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async getAnnouncements(companyId?: string, isActive: boolean = true) {
    try {
      let query = supabase
        .from('announcements')
        .select('*, author:user_profiles(first_name, last_name)')
        .eq('is_active', isActive)
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  // Salary Slip Operations
  static async createSalarySlip(slip: {
    user_id: string;
    month: number;
    year: number;
    basic_salary: number;
    allowances: number;
    deductions: number;
    net_salary: number;
    days_present: number;
    days_absent: number;
  }) {
    try {
      const { data, error } = await supabase
        .from('salary_slips')
        .insert(slip)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  static async getSalarySlips(userId: string) {
    try {
      const { data, error } = await supabase
        .from('salary_slips')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error: this.formatError(error) };
    }
  }

  // Utility Methods
  private static formatError(error: unknown): DatabaseError {
    const err = error as { message?: string; code?: string; details?: string };
    
    if (err.code === '23505') {
      return {
        message: 'A record with this information already exists',
        code: err.code,
        details: err.details
      };
    }
    
    if (err.code === '23503') {
      return {
        message: 'Referenced record does not exist',
        code: err.code,
        details: err.details
      };
    }

    if (err.code === '42501') {
      return {
        message: 'You do not have permission to perform this action',
        code: err.code,
        details: err.details
      };
    }

    return {
      message: err.message || 'An unexpected error occurred',
      code: err.code,
      details: err.details
    };
  }

  // Validation Methods
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  static validateSalary(salary: number): boolean {
    return salary >= 0 && salary <= 999999999.99;
  }

  static validateDate(date: string): boolean {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  }
} 
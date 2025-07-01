-- HR Solutions Database Schema
-- Run this in your Supabase SQL editor
-- This script handles existing objects gracefully

-- Enable Row Level Security (only if not already set)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_settings WHERE name = 'app.jwt_secret') THEN
        ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';
    END IF;
END $$;

-- Create custom types (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_type') THEN
        CREATE TYPE leave_type AS ENUM ('casual', 'sick', 'earned');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_status') THEN
        CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('employee', 'hr', 'admin');
    END IF;
END $$;

-- Companies table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    address TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users) - only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    employee_id TEXT UNIQUE,
    department TEXT,
    position TEXT,
    hire_date DATE,
    salary DECIMAL(10,2),
    role user_role DEFAULT 'employee',
    manager_id UUID REFERENCES public.user_profiles(id),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add company_id column to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'company_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'address') THEN
        ALTER TABLE public.user_profiles ADD COLUMN address TEXT;
    END IF;
END $$;

-- Add missing columns to companies table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'address_line1') THEN
        ALTER TABLE public.companies ADD COLUMN address_line1 TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'address_line2') THEN
        ALTER TABLE public.companies ADD COLUMN address_line2 TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'city') THEN
        ALTER TABLE public.companies ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'state') THEN
        ALTER TABLE public.companies ADD COLUMN state TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'pincode') THEN
        ALTER TABLE public.companies ADD COLUMN pincode TEXT;
    END IF;
END $$;

-- Add missing columns to user_profiles table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'department') THEN
        ALTER TABLE public.user_profiles ADD COLUMN department TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'position') THEN
        ALTER TABLE public.user_profiles ADD COLUMN position TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'salary') THEN
        ALTER TABLE public.user_profiles ADD COLUMN salary DECIMAL(10,2);
    END IF;
END $$;

-- Attendance table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(4,2),
    status TEXT DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Leave table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status leave_status DEFAULT 'pending',
    approved_by UUID REFERENCES public.user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave balance table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.leave_balance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    casual_leave_total INTEGER DEFAULT 10,
    casual_leave_used INTEGER DEFAULT 0,
    sick_leave_total INTEGER DEFAULT 7,
    sick_leave_used INTEGER DEFAULT 0,
    earned_leave_total INTEGER DEFAULT 15,
    earned_leave_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, year)
);

-- Salary slips table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.salary_slips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    basic_salary DECIMAL(10,2) NOT NULL,
    allowances DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL,
    days_present INTEGER NOT NULL,
    days_absent INTEGER NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month, year)
);

-- Announcements table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add company_id column to announcements if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'announcements' AND column_name = 'company_id') THEN
        ALTER TABLE public.announcements ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL DEFAULT (SELECT id FROM public.companies LIMIT 1);
    END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attendance_user_date') THEN
        CREATE INDEX idx_attendance_user_date ON public.attendance(user_id, date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leave_requests_user') THEN
        CREATE INDEX idx_leave_requests_user ON public.leave_requests(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leave_requests_status') THEN
        CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_salary_slips_user_month_year') THEN
        CREATE INDEX idx_salary_slips_user_month_year ON public.salary_slips(user_id, month, year);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_announcements_active') THEN
        CREATE INDEX idx_announcements_active ON public.announcements(is_active);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_company') THEN
        CREATE INDEX idx_user_profiles_company ON public.user_profiles(company_id);
    END IF;
END $$;

-- Enable Row Level Security (only if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'companies' AND rowsecurity = true) THEN
        ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true) THEN
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'attendance' AND rowsecurity = true) THEN
        ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'leave_requests' AND rowsecurity = true) THEN
        ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'leave_balance' AND rowsecurity = true) THEN
        ALTER TABLE public.leave_balance ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'salary_slips' AND rowsecurity = true) THEN
        ALTER TABLE public.salary_slips ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'announcements' AND rowsecurity = true) THEN
        ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
DROP POLICY IF EXISTS "HR can manage company" ON public.companies;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "HR can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update own attendance" ON public.attendance;
DROP POLICY IF EXISTS "HR can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can view own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can insert own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "HR can view all leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "HR can update leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can view own leave balance" ON public.leave_balance;
DROP POLICY IF EXISTS "HR can view all leave balances" ON public.leave_balance;
DROP POLICY IF EXISTS "Users can view own salary slips" ON public.salary_slips;
DROP POLICY IF EXISTS "HR can view all salary slips" ON public.salary_slips;
DROP POLICY IF EXISTS "Users can view company announcements" ON public.announcements;
DROP POLICY IF EXISTS "HR can manage company announcements" ON public.announcements;

-- RLS Policies for Companies
CREATE POLICY "Users can view own company" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE company_id = companies.id AND id = auth.uid()
        )
    );

-- HR/Admin can manage company
CREATE POLICY "HR can manage company" ON public.companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE company_id = companies.id AND id = auth.uid() AND role IN ('hr', 'admin')
        )
    );

-- RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- HR/Admin can view all profiles in their company
CREATE POLICY "HR can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('hr', 'admin') AND company_id = user_profiles.company_id
        )
    );

-- Users can view their own attendance
CREATE POLICY "Users can view own attendance" ON public.attendance
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own attendance
CREATE POLICY "Users can insert own attendance" ON public.attendance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own attendance
CREATE POLICY "Users can update own attendance" ON public.attendance
    FOR UPDATE USING (auth.uid() = user_id);

-- HR/Admin can view all attendance in their company
CREATE POLICY "HR can view all attendance" ON public.attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('hr', 'admin') AND company_id = (
                SELECT company_id FROM public.user_profiles WHERE id = attendance.user_id
            )
        )
    );

-- Users can view their own leave requests
CREATE POLICY "Users can view own leave requests" ON public.leave_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own leave requests
CREATE POLICY "Users can insert own leave requests" ON public.leave_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- HR/Admin can view and update all leave requests in their company
CREATE POLICY "HR can view all leave requests" ON public.leave_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('hr', 'admin') AND company_id = (
                SELECT company_id FROM public.user_profiles WHERE id = leave_requests.user_id
            )
        )
    );

CREATE POLICY "HR can update leave requests" ON public.leave_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('hr', 'admin') AND company_id = (
                SELECT company_id FROM public.user_profiles WHERE id = leave_requests.user_id
            )
        )
    );

-- Users can view their own leave balance
CREATE POLICY "Users can view own leave balance" ON public.leave_balance
    FOR SELECT USING (auth.uid() = user_id);

-- HR/Admin can view all leave balances in their company
CREATE POLICY "HR can view all leave balances" ON public.leave_balance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('hr', 'admin') AND company_id = (
                SELECT company_id FROM public.user_profiles WHERE id = leave_balance.user_id
            )
        )
    );

-- Users can view their own salary slips
CREATE POLICY "Users can view own salary slips" ON public.salary_slips
    FOR SELECT USING (auth.uid() = user_id);

-- HR/Admin can view all salary slips in their company
CREATE POLICY "HR can view all salary slips" ON public.salary_slips
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('hr', 'admin') AND company_id = (
                SELECT company_id FROM public.user_profiles WHERE id = salary_slips.user_id
            )
        )
    );

-- Users can view announcements from their company
CREATE POLICY "Users can view company announcements" ON public.announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND company_id = announcements.company_id
        )
    );

-- HR/Admin can manage announcements in their company
CREATE POLICY "HR can manage company announcements" ON public.announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('hr', 'admin') AND company_id = announcements.company_id
        )
    );

-- Create updated_at trigger function (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
        CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
        CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_attendance_updated_at') THEN
        CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leave_requests_updated_at') THEN
        CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leave_balance_updated_at') THEN
        CREATE TRIGGER update_leave_balance_updated_at BEFORE UPDATE ON public.leave_balance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_announcements_updated_at') THEN
        CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create function to calculate total hours (only if it doesn't exist)
CREATE OR REPLACE FUNCTION calculate_total_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_in IS NOT NULL AND NEW.check_out IS NOT NULL THEN
        NEW.total_hours = EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for attendance hours calculation (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'calculate_attendance_hours') THEN
        CREATE TRIGGER calculate_attendance_hours BEFORE INSERT OR UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION calculate_total_hours();
    END IF;
END $$;

-- Notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_employee_id uuid REFERENCES employee(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create admin_user table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_user') THEN
        CREATE TABLE admin_user (
            id SERIAL PRIMARY KEY,
            company_name TEXT NOT NULL,
            admin_name TEXT NOT NULL,
            admin_email TEXT NOT NULL,
            logo_url TEXT
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_user' AND column_name = 'logo_url') THEN
        ALTER TABLE admin_user ADD COLUMN logo_url TEXT;
    END IF;
END $$; 
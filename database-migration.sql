-- Safe Migration Script for HR Solutions Database
-- This script handles existing objects gracefully

-- 1. Add missing columns to existing tables
DO $$
BEGIN
    -- Add company_id to user_profiles if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'company_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN company_id UUID;
    END IF;
    
    -- Add phone and address to user_profiles if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'address') THEN
        ALTER TABLE public.user_profiles ADD COLUMN address TEXT;
    END IF;
    
    -- Add company_id to announcements if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'announcements' AND column_name = 'company_id') THEN
        ALTER TABLE public.announcements ADD COLUMN company_id UUID;
    END IF;
END $$;

-- 2. Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key for user_profiles.company_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'user_profiles_company_id_fkey') THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for announcements.company_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'announcements_company_id_fkey') THEN
        ALTER TABLE public.announcements 
        ADD CONSTRAINT announcements_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Create missing indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_company') THEN
        CREATE INDEX idx_user_profiles_company ON public.user_profiles(company_id);
    END IF;
END $$;

-- 5. Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for companies
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
CREATE POLICY "Users can view own company" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE company_id = companies.id AND id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "HR can manage company" ON public.companies;
CREATE POLICY "HR can manage company" ON public.companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE company_id = companies.id AND id = auth.uid() AND role IN ('hr', 'admin')
        )
    );

-- 7. Update existing RLS policies to include company isolation
DROP POLICY IF EXISTS "HR can view all profiles" ON public.user_profiles;
CREATE POLICY "HR can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        (
            (id = auth.uid()) OR
            (
                EXISTS (
                    SELECT 1 FROM public.user_profiles up
                    WHERE up.id = auth.uid()
                        AND up.role IN ('hr', 'admin')
                        AND up.company_id = user_profiles.company_id
                )
            )
        )
    );

-- 8. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create trigger for companies table
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON public.companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Add is_active column to companies for soft delete
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'is_active') THEN
        ALTER TABLE public.companies ADD COLUMN is_active BOOLEAN DEFAULT true;
        UPDATE public.companies SET is_active = true WHERE is_active IS NULL;
    END IF;
END $$;

-- Add address and logo fields to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT; 
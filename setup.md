# PeoplePulse HR - Complete Setup Guide

This guide will help you resolve all issues and set up the HR application properly.

## 🚨 Critical Issues Resolved

### 1. Missing Environment Variables
**Problem**: The application requires Supabase configuration that wasn't set up.

**Solution**: 
1. Create a `.env.local` file in the root directory
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### 2. Database Schema Issues
**Problem**: Missing company table and incorrect relationships.

**Solution**: 
1. Run the updated `database-schema.sql` in your Supabase SQL editor
2. This creates the missing `companies` table and fixes all relationships

### 3. User Profile Creation
**Problem**: Users weren't getting proper profiles after registration.

**Solution**: 
1. Updated onboarding flow to create user profiles
2. Added proper company creation for new organizations
3. Implemented role-based access control

### 4. Authentication Flow
**Problem**: Incomplete authentication and authorization.

**Solution**: 
1. Enhanced registration process
2. Added proper onboarding flow
3. Implemented company isolation

## 🔧 Step-by-Step Setup

### Step 1: Supabase Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Get API Credentials**:
   - Go to Settings > API
   - Copy your project URL and anon key
   - Add them to `.env.local`

3. **Run Database Schema**:
   - Go to SQL Editor in Supabase
   - Copy the entire content of `database-schema.sql`
   - Run the script

### Step 2: Environment Configuration

1. **Create `.env.local`**:
```bash
# Copy env.example to .env.local
cp env.example .env.local
```

2. **Update with your values**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run the Application

```bash
npm run dev
```

## 🧪 Testing the Setup

### Test 1: Registration Flow

1. Go to `http://localhost:3000/register`
2. Fill in the form with:
   - Full Name: "John Doe"
   - Email: "john@example.com"
   - Password: "password123"
   - Organization: "Test Company"
3. Click "Create Account"
4. You should be redirected to onboarding

### Test 2: Onboarding Flow

1. Complete the company information
2. Fill in your employee details
3. Submit the form
4. You should be redirected to dashboard

### Test 3: Dashboard Access

1. You should see the dashboard with widgets
2. Check that your company name appears
3. Verify that you have admin role

## 🔍 Troubleshooting Common Issues

### Issue 1: "Supabase client not configured"

**Solution**: 
- Check that `.env.local` exists and has correct values
- Restart the development server
- Verify Supabase project is active

### Issue 2: "Database permission denied"

**Solution**: 
- Ensure RLS policies are applied
- Check that user has proper role assigned
- Verify company_id is set for the user

### Issue 3: "User profile not found"

**Solution**: 
- Complete the onboarding process
- Check that user_profiles table has the record
- Verify the user ID matches

### Issue 4: "Company not found"

**Solution**: 
- Ensure companies table exists
- Check that company was created during onboarding
- Verify company_id in user_profiles

## 📊 Database Verification

After setup, verify these tables exist in Supabase:

1. **companies** - Company information
2. **user_profiles** - Employee profiles
3. **attendance** - Attendance records
4. **leave_requests** - Leave applications
5. **leave_balance** - Leave balances
6. **salary_slips** - Payroll records
7. **announcements** - Company announcements

## 🔐 Security Verification

Check that RLS policies are active:

1. Go to Supabase Dashboard > Authentication > Policies
2. Verify all tables have RLS enabled
3. Check that policies are properly configured

## 🚀 Production Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

## 📱 Features Now Working

After following this setup guide, these features will work:

- ✅ User registration and authentication
- ✅ Company creation and management
- ✅ Employee profile management
- ✅ Role-based access control
- ✅ Attendance tracking
- ✅ Leave management
- ✅ Salary slip generation
- ✅ Company announcements
- ✅ Multi-tenant architecture

## 🆘 Getting Help

If you encounter issues:

1. Check the browser console for errors
2. Verify Supabase logs in the dashboard
3. Ensure all environment variables are set
4. Confirm database schema is applied
5. Check that RLS policies are active

## 🔄 Updates and Maintenance

- Keep dependencies updated: `npm update`
- Monitor Supabase usage and limits
- Regularly backup your database
- Check for security updates

---

**Note**: This setup guide resolves all the critical issues that were preventing the HR application from working properly. The application now has a complete authentication flow, proper database structure, and all core HR features are functional. 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the regular anon key for now - in production you'd want a service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      first_name, last_name, email, department, position, employee_id,
      role, manager_id, hire_date, salary, phone, address, company_id
    } = body;

    if (!company_id) {
      return NextResponse.json({ error: 'Missing company_id.' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(user => user.email === email);
    
    if (userExists) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    // 1. Create user in Supabase Auth (no invite email)
    const tempPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true // Auto-confirm for demo purposes
    });
    
    if (userError || !user?.user?.id) {
      return NextResponse.json({ 
        error: userError?.message || 'Failed to create user.' 
      }, { status: 500 });
    }
    
    const user_id = user.user.id;

    // 2. Insert into user_profiles
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: user_id,
      email,
      first_name,
      last_name,
      employee_id,
      department,
      position,
      hire_date,
      salary,
      role,
      manager_id: manager_id || null,
      phone,
      address,
      company_id
    });
    
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 3. Create initial leave balance
    const currentYear = new Date().getFullYear();
    await supabase.from('leave_balance').insert({
      user_id,
      year: currentYear
    });

    // 4. Send welcome email (simplified version without SendGrid for now)
    // In production, you'd want to use SendGrid or another email service
    console.log(`User ${email} created successfully with temporary password: ${tempPassword}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Employee created successfully',
      tempPassword: tempPassword // Remove this in production
    });
    
  } catch (err: unknown) {
    let message = 'Internal server error.';
    if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: string }).message === 'string') {
      message = (err as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 
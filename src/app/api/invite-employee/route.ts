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
      name,
      email,
      position,
      department,
      date_of_joining,
      salary,
      is_admin,
      company_id
    } = body;

    if (!company_id) {
      return NextResponse.json({ error: 'Missing company_id.' }, { status: 400 });
    }
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    // Check if employee already exists
    const { data: existingEmp } = await supabase
      .from('employee')
      .select('id')
      .eq('email', email)
      .eq('company_id', company_id)
      .single();
    if (existingEmp) {
      return NextResponse.json({ error: 'Employee with this email already exists.' }, { status: 400 });
    }

    // Insert into employee table
    const { error: empError } = await supabase.from('employee').insert({
      company_id,
      name,
      email,
      position,
      department,
      date_of_joining,
      salary: salary ? parseFloat(salary) : null,
      is_admin: !!is_admin,
    });
    if (empError) {
      return NextResponse.json({ error: empError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Employee added successfully' });
  } catch (err: unknown) {
    let message = 'Internal server error.';
    if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: string }).message === 'string') {
      message = (err as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 
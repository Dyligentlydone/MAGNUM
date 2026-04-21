import { NextRequest, NextResponse } from 'next/server';
import { supabaseCreateCustomer } from '@/lib/supabase-crm';

export const POST = async (req: NextRequest) => {
  const body = await req.json();

  const phone = body?.phone;
  const firstName = body?.first_name;
  const lastName = body?.last_name;
  const email = body?.email;

  if (!phone) {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 });
  }

  try {
    const customer = await supabaseCreateCustomer({
      phone,
      first_name: firstName || '',
      last_name: lastName || '',
      email: email || undefined,
    });
    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to create customer' }, { status: s });
  }
};

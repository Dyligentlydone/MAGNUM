import { NextRequest, NextResponse } from 'next/server';
import { supabaseLookupCustomerByPhone } from '@/lib/supabase-crm';

export const GET = async (req: NextRequest) => {
  const phone = req.nextUrl.searchParams.get('phone');
  if (!phone) {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 });
  }

  try {
    const customer = await supabaseLookupCustomerByPhone(phone);
    return NextResponse.json({ data: customer });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to search customer' }, { status: s });
  }
};

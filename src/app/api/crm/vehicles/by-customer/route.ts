import { NextRequest, NextResponse } from 'next/server';
import { supabaseGetVehiclesByCustomer } from '@/lib/supabase-crm';

export const GET = async (req: NextRequest) => {
  const customerId = req.nextUrl.searchParams.get('customer_id');
  if (!customerId) {
    return NextResponse.json({ error: 'customer_id is required' }, { status: 400 });
  }

  try {
    const vehicles = await supabaseGetVehiclesByCustomer(customerId);
    return NextResponse.json({ data: vehicles, info: { count: vehicles.length } });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: s });
  }
};

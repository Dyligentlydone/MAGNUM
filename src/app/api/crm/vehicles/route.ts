import { NextRequest, NextResponse } from 'next/server';
import { supabaseCreateVehicle } from '@/lib/supabase-crm';

export const POST = async (req: NextRequest) => {
  const body = await req.json();

  try {
    const vehicle = await supabaseCreateVehicle({
      year: body?.year || '',
      make: body?.make || '',
      model: body?.model || '',
      customer_id: body?.customer_id || '',
      vin: body?.vin,
      license_plate: body?.license_plate,
    });
    return NextResponse.json({ data: vehicle }, { status: 201 });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: s });
  }
};

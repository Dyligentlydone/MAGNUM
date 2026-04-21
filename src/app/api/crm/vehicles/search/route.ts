import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-crm';

export const GET = async (req: NextRequest) => {
  const vin = req.nextUrl.searchParams.get('vin');
  if (!vin) {
    return NextResponse.json({ error: 'vin is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vin', vin)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return NextResponse.json({ data: data || null });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to search vehicle' }, { status: s });
  }
};

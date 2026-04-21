import { NextRequest, NextResponse } from 'next/server';
import { supabaseGetRepairOrdersByVehicle } from '@/lib/supabase-crm';

export const GET = async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;

  try {
    const repairOrders = await supabaseGetRepairOrdersByVehicle(id);
    return NextResponse.json({
      data: repairOrders,
      info: { count: repairOrders.length },
    });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to fetch repair orders for vehicle' }, { status: s });
  }
};

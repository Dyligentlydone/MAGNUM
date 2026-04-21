import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseGetVehicle, supabaseUpdateVehicle } from '@/lib/supabase-crm';

export const GET = async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;

  try {
    const vehicle = await supabaseGetVehicle(id);
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    return NextResponse.json({ data: vehicle, raw: vehicle });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: s });
  }
};

export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = await req.json();

  try {
    const updates: any = {};
    if (body?.year !== undefined) updates.year = body.year || '';
    if (body?.make !== undefined) updates.make = body.make || '';
    if (body?.model !== undefined) updates.model = body.model || '';
    if (body?.vin !== undefined) updates.vin = body.vin || '';
    if (body?.license_plate !== undefined) updates.license_plate = body.license_plate || '';
    if (body?.engine_size !== undefined) updates.engine_size = body.engine_size || '';
    if (body?.customer_id !== undefined) updates.customer_id = body.customer_id;

    const vehicle = await supabaseUpdateVehicle(id, updates);
    return NextResponse.json({ data: vehicle, raw: vehicle });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: s });
  }
};

export const DELETE = async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;

  try {
    // Nullify vehicle_id on repair orders first (avoid FK constraint)
    await supabase
      .from('repair_orders')
      .update({ vehicle_id: null })
      .eq('vehicle_id', id);

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: s });
  }
};

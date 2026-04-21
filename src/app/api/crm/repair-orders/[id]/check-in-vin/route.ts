import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseGetRepairOrder, supabaseUpdateVehicle } from '@/lib/supabase-crm';

export const POST = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = await req.json();

  const vinRaw = body?.vin;
  const vin = typeof vinRaw === 'string' ? vinRaw.trim() : '';

  if (!vin) {
    return NextResponse.json({ error: 'vin is required' }, { status: 400 });
  }

  try {
    const ro = await supabaseGetRepairOrder(id);
    if (!ro) {
      return NextResponse.json({ error: 'Repair order not found' }, { status: 404 });
    }

    const currentVehicleId = ro.vehicle_id;
    if (!currentVehicleId) {
      return NextResponse.json({ error: 'Repair order has no vehicle linked' }, { status: 400 });
    }

    const { data: found } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vin', vin)
      .single();

    if (found?.id && found.id !== currentVehicleId) {
      // Link repair order to the found vehicle
      const { data: updatedRo, error } = await supabase
        .from('repair_orders')
        .update({ vehicle_id: found.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        data: {
          repairOrder: updatedRo,
          vehicle: found,
          action: 'linked_existing_vehicle',
        },
      });
    }

    const updatedVehicle = await supabaseUpdateVehicle(currentVehicleId, { vin });

    return NextResponse.json({
      data: {
        repairOrder: ro,
        vehicle: updatedVehicle,
        action: found?.id ? 'vin_already_on_current_vehicle' : 'updated_vehicle_vin',
      },
    });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to check-in VIN' }, { status: s });
  }
};

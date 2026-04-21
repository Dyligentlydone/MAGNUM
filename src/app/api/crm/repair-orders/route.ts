import { NextRequest, NextResponse } from 'next/server';
import { clearCache } from './cache';
import { supabase, supabaseCreateRepairOrder, syncRepairOrderToAppointments } from '@/lib/supabase-crm';

export const GET = async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get('status');
  const page = req.nextUrl.searchParams.get('page') || '1';
  const perPage = req.nextUrl.searchParams.get('perPage') || '20';

  try {
    let query = supabase
      .from('repair_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range((parseInt(page) - 1) * parseInt(perPage), parseInt(page) * parseInt(perPage) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      info: { count: count || data?.length || 0 },
    });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to fetch repair orders' }, { status: s });
  }
};

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const vehicleId = body?.vehicle_id;
  const status = body?.status;
  const serviceType = body?.service_type;
  const jobDescription = body?.job_description;
  const note = body?.note;
  const notes = body?.notes;
  const customerId = body?.customer_id;
  const estimatedTotal = body?.estimated_total;
  const finalChargeTotal = body?.final_charge_total;
  const estimatedCompletion = typeof body?.estimated_completion === 'string' ? body.estimated_completion.trim() : '';

  if (!vehicleId) {
    return NextResponse.json({ error: 'vehicle_id is required' }, { status: 400 });
  }


  try {
    const repairOrder = await supabaseCreateRepairOrder({
      vehicle_id: vehicleId,
      customer_id: customerId || '',
      status: status as any,
      service_type: serviceType,
      job_description: jobDescription || notes,
      notes: note || notes,
      estimated_total: typeof estimatedTotal === 'number' ? estimatedTotal : undefined,
      final_charge_total: typeof finalChargeTotal === 'number' ? finalChargeTotal : undefined,
      estimated_completion: estimatedCompletion || undefined,
      scheduled_drop_off: body?.scheduled_drop_off || undefined,
    });

    // Sync dates to appointments table for calendar
    await syncRepairOrderToAppointments(repairOrder.id);

    clearCache();
    return NextResponse.json({ data: repairOrder }, { status: 201 });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to create repair order' }, { status: s });
  }
};

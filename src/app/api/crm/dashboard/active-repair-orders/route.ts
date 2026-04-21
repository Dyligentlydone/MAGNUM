import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-crm';

// Simple dashboard cache - 10 seconds TTL
let dashboardCachePayload: any = null;
let dashboardCacheAt = 0;
const DASHBOARD_CACHE_TTL_MS = 10_000;

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const bustCache = url.searchParams.get('bustCache');

  if (!bustCache && dashboardCachePayload && Date.now() - dashboardCacheAt < DASHBOARD_CACHE_TTL_MS) {
    return NextResponse.json(dashboardCachePayload);
  }

  try {
    const activeStatuses = [
      'In Progress',
      'Diagnosing',
      'Dropped Off',
      'Waiting Approval',
      'Repair Approved',
    ];

    const { data, error } = await supabase
      .from('repair_orders')
      .select(`
        *,
        vehicles!repair_orders_vehicle_id_fkey(*),
        customers!repair_orders_customer_id_fkey(*)
      `)
      .in('status', activeStatuses)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const enriched = (data || []).map((ro: any) => ({
      repairOrder: {
        id: ro.id,
        vehicle_id: ro.vehicle_id,
        customer_id: ro.customer_id,
        status: ro.status,
        service_type: ro.service_type,
        job_description: ro.job_description,
        notes: ro.note,
        estimated_total: ro.estimated_total,
        final_charge_total: ro.final_charge_total,
        estimated_completion: ro.estimated_completion,
        scheduled_drop_off: ro.scheduled_drop_off,
        created_time: ro.created_at,
        updated_time: ro.updated_at,
      },
      vehicle: ro.vehicles,
      customer: ro.customers,
    }));

    const payload = { data: enriched };
    dashboardCachePayload = payload;
    dashboardCacheAt = Date.now();

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
};

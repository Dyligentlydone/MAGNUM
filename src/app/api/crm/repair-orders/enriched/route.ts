import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '../cache';
import { supabase } from '@/lib/supabase-crm';

export const GET = async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get('status');
  const page = req.nextUrl.searchParams.get('page') || '1';
  const perPage = req.nextUrl.searchParams.get('perPage') || '20';

  const cacheKey = `${status || ''}|${page}|${perPage}`;
  
  // Check cache
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    let query = supabase
      .from('repair_orders')
      .select(`
        *,
        vehicle:vehicles(*),
        customer:customers(*)
      `)
      .order('updated_at', { ascending: false })
      .range((parseInt(page) - 1) * parseInt(perPage), parseInt(page) * parseInt(perPage) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const enriched = (data || []).map((ro: any) => ({
      repairOrder: {
        id: ro.id,
        vehicle_id: ro.vehicle_id,
        customer_id: ro.customer_id,
        status: ro.status,
        service_type: ro.service_type,
        job_description: ro.job_description,
        notes: ro.notes,
        estimated_total: ro.estimated_total,
        final_charge_total: ro.final_charge_total,
        estimated_completion: ro.estimated_completion,
        scheduled_drop_off: ro.scheduled_drop_off,
        created_time: ro.created_at,
        updated_time: ro.updated_at,
      },
      vehicle: ro.vehicle,
      customer: ro.customer,
    }));

    const payload = {
      data: enriched,
      info: { count: count || data?.length || 0 },
    };

    setCache(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (err: any) {
    const statusCode = err?.response?.status;
    const data = err?.response?.data;
    console.error('repair-orders/enriched error', {
      status: statusCode,
      data,
      message: err?.message,
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch repair orders',
        status: statusCode || 500,
        details: data || err?.message || null,
      },
      { status: statusCode || 500 }
    );
  }
};

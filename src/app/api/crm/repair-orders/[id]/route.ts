import { NextRequest, NextResponse } from 'next/server';
import { clearCache } from '../cache';
import { supabase, supabaseGetRepairOrder, supabaseUpdateRepairOrder, syncRepairOrderToAppointments } from '@/lib/supabase-crm';

export const GET = async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;

  try {
    const repairOrder = await supabaseGetRepairOrder(id);
    if (!repairOrder) {
      return NextResponse.json({ error: 'Repair order not found' }, { status: 404 });
    }
    return NextResponse.json({ data: repairOrder });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to fetch repair order' }, { status: s });
  }
};

export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = await req.json();

  try {
    const updates: any = {};
    if (body?.status) updates.status = body.status;
    if (body?.service_type) updates.service_type = body.service_type;
    if (body?.note !== undefined) updates.notes = body.note;
    if (body?.job_description !== undefined) updates.job_description = body.job_description;
    if (body?.notes !== undefined) {
      updates.notes = body.notes;
      updates.job_description = body.notes;
    }
    if (typeof body?.estimated_total === 'number') updates.estimated_total = body.estimated_total;
    if (typeof body?.final_charge_total === 'number') updates.final_charge_total = body.final_charge_total;
    if (typeof body?.estimated_completion === 'string' && body.estimated_completion.trim()) {
      updates.estimated_completion = body.estimated_completion.trim();
    }
    if (typeof body?.scheduled_drop_off === 'string' && body.scheduled_drop_off.trim()) {
      updates.scheduled_drop_off = body.scheduled_drop_off.trim();
    }

    const repairOrder = await supabaseUpdateRepairOrder({ id, ...updates });

    // Sync dates to appointments table for calendar
    await syncRepairOrderToAppointments(id);

    clearCache();
    return NextResponse.json({ data: repairOrder });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to update repair order' }, { status: s });
  }
};

export const DELETE = async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;

  try {
    // Delete appointments first (not cascade due to schema)
    await supabase
      .from('appointments')
      .delete()
      .eq('repair_order_id', id);

    // Delete from Supabase (cascades to attachments)
    const { error } = await supabase
      .from('repair_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    clearCache();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to delete repair order' }, { status: s });
  }
};

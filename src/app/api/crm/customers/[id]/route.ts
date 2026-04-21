import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseGetCustomer, supabaseUpdateCustomer } from '@/lib/supabase-crm';

export const GET = async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;

  try {
    const customer = await supabaseGetCustomer(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json({ data: customer, raw: customer });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: s });
  }
};

export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = await req.json();

  try {
    const updates: any = {};
    if (body?.first_name !== undefined) updates.first_name = body.first_name || '';
    if (body?.last_name !== undefined) updates.last_name = body.last_name || '';
    if (body?.phone !== undefined) updates.phone = body.phone || '';
    if (body?.email !== undefined) updates.email = body.email || '';

    const customer = await supabaseUpdateCustomer(id, updates);
    return NextResponse.json({ data: customer, raw: customer });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to update customer' }, { status: s });
  }
};

export const DELETE = async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;

  try {
    // Cascade-delete dependent rows the schema doesn't auto-cascade:
    // 1. appointments for repair orders owned by this customer
    const { data: ros } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('customer_id', id);

    const roIds = (ros || []).map((r) => r.id);

    if (roIds.length) {
      await supabase.from('appointments').delete().in('repair_order_id', roIds);
      // repair_order_attachments cascade via FK ON DELETE CASCADE
      await supabase.from('repair_orders').delete().in('id', roIds);
    }

    // 2. vehicles owned by this customer (FK is ON DELETE SET NULL, so manually delete)
    await supabase.from('vehicles').delete().eq('customer_id', id);

    // 3. the customer
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to delete customer', details: err?.message }, { status: s });
  }
};

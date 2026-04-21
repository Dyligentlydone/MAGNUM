import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-crm';

const isLikelyPhone = (q: string) => {
  const digits = q.replace(/\D/g, '');
  return digits.length >= 3 && digits.length <= 15;
};

const isLikelyRoId = (q: string) => {
  const s = q.trim().toLowerCase();
  return /^[0-9a-f]{4,}(-[0-9a-f]+)*$/.test(s);
};

const isLikelyVin = (q: string) => {
  const s = q.trim().toUpperCase();
  if (!/^[A-Z0-9]+$/.test(s)) return false;
  return s.length >= 11 && s.length <= 17;
};

const safeLimit = (n: number, fallback: number) => {
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.max(Math.floor(n), 1), 50);
};

type CustomerResult = { id: string; name: string; phone?: string; email?: string };

type VehicleResult = {
  id: string;
  display: string;
  vin?: string;
  plate?: string;
  customerName?: string;
  customerPhone?: string;
};

type RepairOrderResult = {
  id: string;
  status: string;
  serviceType?: string;
  vehicleDisplay?: string;
  customerName?: string;
  customerPhone?: string;
  updatedAt?: string;
};

export const GET = async (req: NextRequest) => {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  const limit = safeLimit(Number(req.nextUrl.searchParams.get('limit') || '5'), 5);

  if (!q) {
    return NextResponse.json({ customers: [], vehicles: [], repairOrders: [] });
  }

  const qDigits = q.replace(/\D/g, '');
  const qVin = q.trim().toUpperCase();

  try {
    const customers: CustomerResult[] = [];
    const vehicles: VehicleResult[] = [];
    const repairOrders: RepairOrderResult[] = [];

    if (isLikelyPhone(q) && !isLikelyRoId(q)) {
      const phonePattern = `%${qDigits.split('').join('%')}%`;

      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .ilike('phone', phonePattern)
        .limit(limit);

      if (customerData) {
        const normalizePhone = (p: string) => p.replace(/\D/g, '');
        const matchingCustomers = customerData.filter((c) => {
          const normalized = normalizePhone(c.phone || '');
          return normalized.includes(qDigits);
        });

        matchingCustomers.forEach((c) => {
          const name = `${c.first_name} ${c.last_name}`.trim() || c.phone || c.email || c.id;
          const result: CustomerResult = { id: c.id, name };
          if (c.phone) result.phone = c.phone;
          if (c.email) result.email = c.email;
          customers.push(result);
        });

        const customerIds = matchingCustomers.map((c) => c.id);
        if (customerIds.length) {
          const { data: roData } = await supabase
            .from('repair_orders')
            .select(`*, vehicle:vehicles(*), customer:customers(*)`)
            .in('customer_id', customerIds)
            .limit(limit);

          roData?.forEach((ro: any) => {
            const v = ro.vehicle;
            const c = ro.customer;
            repairOrders.push({
              id: ro.id,
              status: ro.status,
              serviceType: ro.service_type,
              vehicleDisplay: v ? [v.year, v.make, v.model].filter(Boolean).join(' ') : undefined,
              customerName: c ? `${c.first_name} ${c.last_name}`.trim() : undefined,
              customerPhone: c?.phone,
              updatedAt: ro.updated_at,
            });
          });
        }
      }
    } else if (isLikelyVin(q)) {
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('*, customer:customers(*)')
        .eq('vin', qVin)
        .limit(limit);

      if (vehicleData) {
        vehicleData.forEach((v: any) => {
          const display = [v.year, v.make, v.model].filter(Boolean).join(' ') || v.id;
          const c = v.customer;
          const result: VehicleResult = {
            id: v.id,
            display,
            vin: v.vin,
            plate: v.license_plate,
          };
          if (c) {
            const name = `${c.first_name} ${c.last_name}`.trim();
            if (name) result.customerName = name;
            if (c.phone) result.customerPhone = c.phone;
          }
          vehicles.push(result);
        });

        const vehicleIds = vehicleData.map((v) => v.id);
        if (vehicleIds.length) {
          const { data: roData } = await supabase
            .from('repair_orders')
            .select(`*, vehicle:vehicles(*), customer:customers(*)`)
            .in('vehicle_id', vehicleIds)
            .limit(limit);

          roData?.forEach((ro: any) => {
            const v = ro.vehicle;
            const c = ro.customer;
            repairOrders.push({
              id: ro.id,
              status: ro.status,
              serviceType: ro.service_type,
              vehicleDisplay: v ? [v.year, v.make, v.model].filter(Boolean).join(' ') : undefined,
              customerName: c ? `${c.first_name} ${c.last_name}`.trim() : undefined,
              customerPhone: c?.phone,
              updatedAt: ro.updated_at,
            });
          });
        }
      }
    } else {
      const searchPattern = `%${q}%`;

      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .or(
          `first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},phone.ilike.${searchPattern},email.ilike.${searchPattern}`
        )
        .limit(limit);

      customerData?.forEach((c) => {
        const name = `${c.first_name} ${c.last_name}`.trim() || c.phone || c.email || c.id;
        const result: CustomerResult = { id: c.id, name };
        if (c.phone) result.phone = c.phone;
        if (c.email) result.email = c.email;
        customers.push(result);
      });

      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('*, customer:customers(*)')
        .or(
          `year.ilike.${searchPattern},make.ilike.${searchPattern},model.ilike.${searchPattern},vin.ilike.${searchPattern},license_plate.ilike.${searchPattern}`
        )
        .limit(limit);

      vehicleData?.forEach((v: any) => {
        const display = [v.year, v.make, v.model].filter(Boolean).join(' ') || v.id;
        const c = v.customer;
        const result: VehicleResult = {
          id: v.id,
          display,
          vin: v.vin,
          plate: v.license_plate,
        };
        if (c) {
          const name = `${c.first_name} ${c.last_name}`.trim();
          if (name) result.customerName = name;
          if (c.phone) result.customerPhone = c.phone;
        }
        vehicles.push(result);
      });

      const { data: roData } = await supabase
        .from('repair_orders')
        .select(`*, vehicle:vehicles(*), customer:customers(*)`)
        .or(
          `service_type.ilike.${searchPattern},job_description.ilike.${searchPattern},note.ilike.${searchPattern}`
        )
        .limit(limit);

      const pushRo = (ro: any) => {
        if (repairOrders.find((r) => r.id === ro.id)) return;
        const v = ro.vehicle;
        const c = ro.customer;
        repairOrders.push({
          id: ro.id,
          status: ro.status,
          serviceType: ro.service_type,
          vehicleDisplay: v ? [v.year, v.make, v.model].filter(Boolean).join(' ') : undefined,
          customerName: c ? `${c.first_name} ${c.last_name}`.trim() : undefined,
          customerPhone: c?.phone,
          updatedAt: ro.updated_at,
        });
      };

      roData?.forEach(pushRo);

      // Also search by RO ID prefix
      const qClean = q.trim().toLowerCase().replace(/-/g, '');
      if (/^[0-9a-f]{4,32}$/.test(qClean)) {
        const loHex = qClean.padEnd(32, '0');
        const hiHex = qClean.padEnd(32, 'f');
        const toUuid = (h: string) =>
          `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;

        const { data: roById } = await supabase
          .from('repair_orders')
          .select(`*, vehicle:vehicles(*), customer:customers(*)`)
          .gte('id', toUuid(loHex))
          .lte('id', toUuid(hiHex))
          .limit(limit);

        roById?.forEach(pushRo);
      }
    }

    return NextResponse.json({ customers, vehicles, repairOrders });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to search CRM' }, { status: s });
  }
};

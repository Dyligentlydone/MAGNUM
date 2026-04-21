'use client';

import Link from 'next/link';
import { useActiveRepairOrders } from '@/hooks/use-active-repair-orders';
import type { ActiveRepairOrderItem } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'Scheduled': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Dropped Off': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Diagnosing': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Waiting Approval': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Repair Approved': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'In Progress': 'bg-[#d7b73f]/20 text-[#d7b73f] border-[#d7b73f]/40',
  'Ready For Pickup': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Completed': 'bg-slate-600/20 text-slate-400 border-slate-600/30',
};

export default function RecentActiveRepairOrders() {
  const { data, isLoading } = useActiveRepairOrders();

  if (isLoading) {
    return (
      <div className="surface p-6">
        <div className="text-center text-sm text-slate-400">Loading recent repair orders...</div>
      </div>
    );
  }

  const items = (data || []) as ActiveRepairOrderItem[];

  // Exclude completed, sort by most-recently-updated, take top 10
  const top10 = items
    .filter((item) => (item.repairOrder.status || '').toLowerCase() !== 'completed')
    .sort((a, b) => {
      const aTime = new Date(a.repairOrder.updated_time || a.repairOrder.created_time || 0).getTime();
      const bTime = new Date(b.repairOrder.updated_time || b.repairOrder.created_time || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 10);

  return (
    <div className="surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recent Activity
          </div>
          <div className="mt-1 text-lg font-semibold" style={{ color: '#d7b73f' }}>
            Top 10 Active Repair Orders
          </div>
        </div>
        <Link
          href="/repair-orders"
          className="text-xs font-semibold uppercase tracking-wider text-slate-400 transition hover:text-[#d7b73f]"
        >
          View all →
        </Link>
      </div>

      {top10.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/3 p-6 text-center text-sm text-slate-400">
          No active repair orders yet.
        </div>
      ) : (
        <div className="space-y-2">
          {top10.map((item) => {
            const { repairOrder: ro, vehicle, customer } = item;
            const customerName = customer
              ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || '—'
              : '—';
            const vehicleDisplay = vehicle
              ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim()
              : '—';
            const statusClass = STATUS_COLORS[ro.status] || STATUS_COLORS['New'];
            const updated = ro.updated_time
              ? new Date(ro.updated_time).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : '';

            return (
              <Link
                key={ro.id}
                href={`/repair-orders/${ro.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/3 p-3 transition hover:border-[#d7b73f]/30 hover:bg-[#d7b73f]/5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <span className="truncate">{customerName}</span>
                      <span className="text-slate-500">·</span>
                      <span className="truncate text-slate-300">{vehicleDisplay}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span className="truncate">
                        {ro.service_type || ro.job_description || 'No service description'}
                      </span>
                      {updated && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span>Updated {updated}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass}`}
                >
                  {ro.status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

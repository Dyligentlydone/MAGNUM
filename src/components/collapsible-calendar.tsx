'use client';

import { useState } from 'react';
import AppointmentCalendar from '@/components/appointment-calendar';

export default function CollapsibleCalendar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 rounded-xl px-6 py-4 text-left transition hover:bg-white/3"
        aria-expanded={open}
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Schedule
          </div>
          <div className="mt-1 text-lg font-semibold" style={{ color: '#d7b73f' }}>
            Appointment Calendar
          </div>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d7b73f]/30 bg-[#d7b73f]/10 transition"
          style={{ color: '#d7b73f' }}
        >
          <span
            className="block text-lg leading-none transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▾
          </span>
        </div>
      </button>
      {open ? (
        <div className="border-t border-white/10 px-6 pb-6 pt-4">
          <AppointmentCalendar />
        </div>
      ) : null}
    </div>
  );
}

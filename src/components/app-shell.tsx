'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import logo from '../../magnum x dyligent.png';
import GlobalSearch from '@/components/global-search';

type NavItem = {
  label: string;
  href: string;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isDashboard = pathname === '/dashboard';

  const items: NavItem[] = useMemo(
    () => [
      { label: 'Command Center', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Estimate', href: '/estimate' },
      { label: 'Repair orders', href: '/repair-orders' },
      { label: 'New repair', href: '/repair-orders/new' },
      { label: 'Communications', href: '/communications' },
      { label: 'Settings', href: '/settings' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-black text-slate-100">
      <div className="flex min-h-screen">
        <aside
          className="border-r border-white/10 bg-black/40 backdrop-blur"
          style={{ width: collapsed ? 72 : 280 }}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-4">
            <a className="flex items-center" href="/">
              <Image
                src={logo}
                alt="Magnum"
                priority
                className={collapsed ? 'h-8 w-auto' : 'h-9 w-auto'}
              />
            </a>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="rounded-full border border-[#d7b73f]/30 bg-[#d7b73f]/10 px-3 py-1 text-xs font-semibold"
              style={{ color: '#d7b73f' }}
              aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
              title={collapsed ? 'Expand menu' : 'Collapse menu'}
            >
              {collapsed ? '>' : '<'}
            </button>
          </div>

          {!collapsed ? (
            <div className="px-4 pb-4">
              <GlobalSearch placeholder="Search…" />
            </div>
          ) : null}

          <nav className="px-2 pb-4">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={
                    'flex items-center rounded-full px-3 py-2 text-sm font-medium transition ' +
                    (active
                      ? 'bg-[#d7b73f]/15'
                      : 'hover:bg-[#d7b73f]/10 active:bg-[#d7b73f]/15')
                  }
                  style={{ color: '#d7b73f' }}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={collapsed ? 'sr-only' : 'truncate'}>{item.label}</span>
                  {collapsed ? <span className="mx-auto">•</span> : null}
                </a>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">
          <div className={isDashboard ? 'h-dvh px-0 py-0' : 'mx-auto max-w-6xl px-6 py-8'}>
            {!isDashboard ? (
              <div className="mb-6 flex items-center justify-end">
                <button
                  type="button"
                  className="rounded-full border border-[#d7b73f]/30 bg-[#d7b73f]/10 px-4 py-2 text-xs font-semibold"
                  style={{ color: '#d7b73f' }}
                  onClick={async () => {
                    try {
                      await fetch('/api/auth/logout', { method: 'POST' });
                    } finally {
                      const next = pathname || '/';
                      router.replace(`/login?next=${encodeURIComponent(next)}`);
                      router.refresh();
                    }
                  }}
                  aria-label="Lock"
                  title="Lock"
                >
                  Lock
                </button>
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

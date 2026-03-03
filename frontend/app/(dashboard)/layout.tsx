'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
    ],
  },
  {
    label: 'PRODUCTION',
    items: [
      { href: '/planner', label: 'Production Planner', icon: '📅' },
    ],
  },
  {
    label: 'DATA',
    items: [
      { href: '/ingredients', label: 'Ingredients', icon: '🥦' },
      { href: '/sub-recipes', label: 'Sub-Recipes', icon: '🍲' },
      { href: '/meals', label: 'Meals', icon: '🍽' },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { href: '/reports/cooking', label: 'Cooking Report', icon: '👨‍🍳' },
      { href: '/reports/sub-recipes', label: 'SR Report', icon: '📊' },
      { href: '/reports/shopping-list', label: 'Shopping List', icon: '🛒' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { href: '/import', label: 'Import CSV', icon: '⬆' },
      { href: '/export', label: 'Export', icon: '⬇' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('access_token');
    if (!token) router.push('/login');
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('access_token');
    router.push('/login');
  }

  if (!mounted) return null;

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/planner') return pathname === '/planner' || pathname.startsWith('/planner/');
    if (href === '/meals') return pathname === '/meals' || pathname.startsWith('/meals/');
    return pathname.startsWith(href);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="sidebar w-60 bg-[#1B4332] flex flex-col flex-shrink-0 overflow-y-auto">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-[#2D6A4F]">
          <div className="w-8 h-8 bg-[#52B788] rounded-lg flex items-center justify-center text-[#1B4332] font-bold text-sm mr-2.5 flex-shrink-0">
            B
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">BetterDay</p>
            <p className="text-[#7A9080] text-xs leading-tight">Culinary Ops</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="text-[#7A9080] text-[10px] font-semibold uppercase tracking-wider px-3 mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-[rgba(82,183,136,0.15)] text-white border-l-2 border-[#52B788] font-medium'
                          : 'text-[#B7E4C7] hover:bg-[rgba(255,255,255,0.07)] hover:text-white'
                      }`}
                    >
                      <span className="text-base leading-none">{icon}</span>
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-[#2D6A4F]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#7A9080] hover:bg-[rgba(255,255,255,0.07)] hover:text-white transition-colors"
          >
            <span className="text-base">→</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#F5F0E8]">{children}</main>
    </div>
  );
}

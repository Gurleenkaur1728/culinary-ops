'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/dashboard',              label: 'Dashboard',        icon: '⊞' },
  { href: '/ingredients',            label: 'Ingredients',      icon: '🥦' },
  { href: '/sub-recipes',            label: 'Sub-Recipes',      icon: '🍲' },
  { href: '/meals',                  label: 'Meal Recipes',     icon: '🍽' },
  { href: '/meals/pricing',          label: 'Meal Pricing',     icon: '💲' },
  { href: '/production',             label: 'Production Plans', icon: '📅' },
  { href: '/reports/meals',          label: 'Meals Report',     icon: '📋' },
  { href: '/reports/cooking',        label: 'Cooking Report',   icon: '👨‍🍳' },
  { href: '/reports/sub-recipes',    label: 'Sub-Recipes Report', icon: '📊' },
  { href: '/reports/shopping-list',  label: 'Shopping List',    icon: '🛒' },
  { href: '/settings',               label: 'Settings',         icon: '⚙' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) router.push('/login');
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('access_token');
    router.push('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-gray-200">
          <span className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-2.5">
            C
          </span>
          <span className="font-semibold text-gray-900 text-sm">Culinary Ops</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <span className="text-base leading-none">→</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ProductionPlan } from '../../lib/api';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const [counts, setCounts] = useState({ meals: 0, subRecipes: 0, ingredients: 0 });
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMeals({ take: 1 }),
      api.getSubRecipes({ take: 1 }),
      api.getIngredients({ take: 1 }),
      api.getPlans(),
    ]).then(([meals, srs, ings, plans]) => {
      setCounts({ meals: meals.total, subRecipes: srs.total, ingredients: ings.total });
      setPlans(plans.filter((p) => p.status !== 'completed').slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Meals', value: counts.meals, href: '/meals', color: 'bg-[#D8F3DC] text-[#1B4332]' },
    { label: 'Sub-Recipes', value: counts.subRecipes, href: '/sub-recipes', color: 'bg-[#B7E4C7] text-[#1B4332]' },
    { label: 'Ingredients', value: counts.ingredients, href: '/ingredients', color: 'bg-[#D8F3DC] text-[#1B4332]' },
    { label: 'Active Plans', value: plans.length, href: '/planner', color: 'bg-[#B7E4C7] text-[#1B4332]' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#1A1A18]">
          {getGreeting()} 🌿
        </h1>
        <p className="text-[#7A9080] mt-1">{new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, href, color }) => (
          <Link key={label} href={href} className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-5 hover:shadow-sm transition-shadow">
            <p className="text-sm text-[#7A9080] mb-1">{label}</p>
            <p className={`text-3xl font-bold px-2 py-0.5 rounded-md inline-block ${color}`}>
              {loading ? '—' : value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Active Plans */}
        <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-[#1A1A18]">Active Plans</h2>
            <Link href="/planner" className="text-xs text-[#52B788] hover:underline">View all →</Link>
          </div>
          {loading ? (
            <p className="text-[#7A9080] text-sm">Loading...</p>
          ) : plans.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[#7A9080] text-sm mb-3">No active plans yet</p>
              <Link href="/planner" className="inline-block px-4 py-2 bg-[#1B4332] text-white text-sm rounded-lg hover:bg-[#2D6A4F] transition-colors">
                + New Plan
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {plans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between py-2 border-b border-[#E0EAE2] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A18]">{plan.name}</p>
                    <p className="text-xs text-[#7A9080]">{plan.weekLabel || 'No week set'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      plan.status === 'confirmed' ? 'bg-[#D8F3DC] text-[#1B4332]' :
                      plan.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {plan.status}
                    </span>
                    <Link href={`/planner/${plan.id}`} className="text-xs text-[#52B788] hover:underline">Open →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-5">
          <h2 className="font-display text-lg font-semibold text-[#1A1A18] mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: '/planner', label: '📅 New Production Plan', desc: 'Set up weekly quantities' },
              { href: '/meals', label: '🍽 Browse Meals', desc: '154 meals with sub-recipes' },
              { href: '/sub-recipes', label: '🍲 Sub-Recipes', desc: '730 sub-recipes by station' },
              { href: '/import', label: '⬆ Import CSV', desc: 'Upload masterlist CSVs' },
              { href: '/reports/cooking', label: '👨‍🍳 Cooking Report', desc: 'Batch quantities by station' },
              { href: '/reports/shopping-list', label: '🛒 Shopping List', desc: 'Total ingredients to buy' },
            ].map(({ href, label, desc }) => (
              <Link key={href} href={href} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#D8F3DC] transition-colors group">
                <div>
                  <p className="text-sm font-medium text-[#1A1A18] group-hover:text-[#1B4332]">{label}</p>
                  <p className="text-xs text-[#7A9080]">{desc}</p>
                </div>
                <span className="text-[#7A9080] group-hover:text-[#1B4332]">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

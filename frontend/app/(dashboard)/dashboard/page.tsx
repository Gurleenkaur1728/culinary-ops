'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Ingredient, MealRecipe, SubRecipe, ProductionPlan } from '../../lib/api';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [meals, setMeals] = useState<MealRecipe[]>([]);
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [currentPlan, setCurrentPlan] = useState<ProductionPlan | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    Promise.all([
      api.getIngredients(),
      api.getMeals(),
      api.getSubRecipes(),
      api.getCurrentProductionPlan().catch(() => null),
    ])
      .then(([i, m, s, plan]) => {
        setIngredients(i);
        setMeals(m);
        setSubRecipes(s);
        setCurrentPlan(plan);
      })
      .finally(() => setLoading(false));
  }, []);

  async function recalculate() {
    setRecalculating(true);
    try {
      const res = await api.recalculateCosts();
      alert(`Recalculated: ${res.subRecipes} sub-recipes, ${res.meals} meals`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRecalculating(false);
    }
  }

  const stats = [
    { label: 'Ingredients', value: ingredients.length, href: '/ingredients', color: 'bg-blue-50 text-blue-700' },
    { label: 'Sub-Recipes', value: subRecipes.length, href: '/sub-recipes', color: 'bg-green-50 text-green-700' },
    { label: 'Meal Recipes', value: meals.length, href: '/meals', color: 'bg-orange-50 text-orange-700' },
    {
      label: 'Avg Meal Cost',
      value: meals.length
        ? `$${(meals.reduce((s, m) => s + m.computed_cost, 0) / meals.length).toFixed(2)}`
        : '$0.00',
      href: '/meals/pricing',
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/reports/meals?start=${today}&end=${today}`}
            className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
          >
            Today's Report
          </Link>
          <button
            onClick={recalculate}
            disabled={recalculating}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {recalculating ? 'Recalculating...' : 'Recalculate Costs'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, href, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
          >
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold px-2 py-0.5 rounded-md inline-block ${color}`}>
              {loading ? '—' : value}
            </p>
          </Link>
        ))}
      </div>

      {/* This week's production plan */}
      <div className="mb-4">
        {loading || currentPlan === undefined ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-32" />
        ) : currentPlan ? (
          (() => {
            const portionedCount = currentPlan.items.filter((it) => it.quantity > 0).length;
            const totalPortions = currentPlan.items.reduce((s, it) => s + it.quantity, 0);
            const statusColors: Record<string, string> = {
              draft: 'bg-yellow-100 text-yellow-700',
              confirmed: 'bg-blue-100 text-blue-700',
              completed: 'bg-green-100 text-green-700',
            };
            return (
              <div className="bg-white rounded-xl border border-brand-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base">📅</span>
                      <h2 className="font-semibold text-gray-900">This Week's Production Plan</h2>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[currentPlan.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {currentPlan.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 ml-6">{currentPlan.week_label}</p>
                  </div>
                  <Link
                    href={`/production/${currentPlan.id}`}
                    className="px-3 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    Open Plan →
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{currentPlan.items.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Meals on menu</p>
                  </div>
                  <div className="bg-brand-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-brand-700">{portionedCount}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Meals with portions</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{totalPortions}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Total portions</p>
                  </div>
                </div>

                {portionedCount > 0 && (
                  <div className="flex gap-2">
                    <Link
                      href={`/production/${currentPlan.id}?tab=sub-recipe`}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      🍳 Sub-Recipe Report
                    </Link>
                    <Link
                      href={`/production/${currentPlan.id}?tab=shopping`}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      🛒 Shopping List
                    </Link>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">No production plan for this week</p>
              <p className="text-sm text-gray-400 mt-0.5">Create a plan to start generating kitchen reports</p>
            </div>
            <Link
              href="/production/new"
              className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
            >
              + Create Plan
            </Link>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: '/production/new', label: '📅 New Production Plan' },
              { href: '/ingredients', label: '+ Add Ingredient' },
              { href: '/sub-recipes/new', label: '+ New Sub-Recipe' },
              { href: '/meals/new', label: '+ New Meal Recipe' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Production Reports</h2>
          <div className="space-y-2">
            {[
              { href: '/reports/meals', label: 'Meals Report' },
              { href: '/reports/cooking', label: 'Cooking Report' },
              { href: '/reports/sub-recipes', label: 'Sub-Recipes Report' },
              { href: '/reports/shopping-list', label: 'Shopping List' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {label} →
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent meals */}
      {meals.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Meal Recipes</h2>
            <Link href="/meals" className="text-sm text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {meals.slice(0, 5).map((meal) => (
              <div key={meal.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{meal.display_name}</p>
                  <p className="text-xs text-gray-500">{meal.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ${meal.computed_cost.toFixed(2)}
                  </p>
                  {meal.pricing_override && (
                    <p className="text-xs text-green-600">
                      Sell: ${meal.pricing_override.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

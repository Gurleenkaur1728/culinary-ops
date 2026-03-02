'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, MealRecipe } from '../../lib/api';

export default function MealsPage() {
  const [meals, setMeals] = useState<MealRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      setMeals(await api.getMeals());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this meal recipe?')) return;
    try {
      await api.deleteMeal(id);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  const filtered = meals.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.display_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meal Recipes</h1>
        <Link
          href="/meals/new"
          className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
        >
          + New Meal Recipe
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search meals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Display Name', 'Yield (g)', 'Computed Cost', 'Sell Price', 'Margin', 'Components', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No meals found</td></tr>
            ) : (
              filtered.map((meal) => {
                const margin = meal.pricing_override
                  ? (((meal.pricing_override - meal.computed_cost) / meal.pricing_override) * 100).toFixed(1)
                  : null;
                return (
                  <tr key={meal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{meal.name}</td>
                    <td className="px-4 py-3 text-gray-600">{meal.display_name}</td>
                    <td className="px-4 py-3 text-gray-600">{meal.final_yield_weight}g</td>
                    <td className="px-4 py-3 font-medium text-gray-900">${meal.computed_cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {meal.pricing_override ? `$${meal.pricing_override.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {margin ? (
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          Number(margin) > 50 ? 'bg-green-50 text-green-700' :
                          Number(margin) > 20 ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {margin}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{meal.components.length}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/meals/${meal.id}`} className="text-xs text-brand-600 hover:underline">Edit</Link>
                        <button onClick={() => handleDelete(meal.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

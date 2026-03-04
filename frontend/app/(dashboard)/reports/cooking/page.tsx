'use client';

import { useEffect, useState } from 'react';
import { apiExtra, CookingSheetMeal } from '../../../lib/api';

export default function CookingReportPage() {
  const [meals, setMeals] = useState<CookingSheetMeal[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiExtra.getMealCategories().then(setCategories).catch(() => {});
    load();
  }, []);

  async function load(cat?: string) {
    setLoading(true);
    try {
      const data = await apiExtra.getCookingSheet(cat);
      setMeals(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryChange(cat: string) {
    setFilterCategory(cat);
    load(cat || undefined);
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpandedIds(new Set(meals.map((m) => m.id)));
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  const filtered = meals.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.display_name.toLowerCase().includes(search.toLowerCase()),
  );

  // Group by category
  const byCategory: Record<string, CookingSheetMeal[]> = {};
  for (const meal of filtered) {
    const key = meal.category ?? 'Other';
    if (!byCategory[key]) byCategory[key] = [];
    byCategory[key].push(meal);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cooking Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Meal recipes with sub-recipe components and instructions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={expandAll} className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">Expand All</button>
          <button onClick={collapseAll} className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">Collapse All</button>
          <button onClick={() => window.print()} className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">Print</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Search meals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCategory === '' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => handleCategoryChange(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCategory === c ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catMeals]) => (
            <div key={cat}>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                {cat}
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-normal">{catMeals.length}</span>
              </h2>
              <div className="space-y-2">
                {catMeals.map((meal) => (
                  <div key={meal.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => toggleExpand(meal.id)}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">{meal.display_name}</span>
                        {meal.pricing_override && (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                            ${meal.pricing_override.toFixed(2)}
                          </span>
                        )}
                        {meal.allergen_tags?.length > 0 && (
                          <div className="flex gap-1">
                            {meal.allergen_tags.map((a) => (
                              <span key={a} className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-xs">{a}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{meal.components.length} components</span>
                        <span className="text-gray-400 text-xs">{expandedIds.has(meal.id) ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {expandedIds.has(meal.id) && (
                      <div className="border-t border-gray-100">
                        {/* Components */}
                        {meal.components.length > 0 && (
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase">Component</th>
                                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty / Portion</th>
                                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase">Station</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {meal.components.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                  <td className="px-5 py-2.5 font-medium text-gray-800">
                                    {c.sub_recipe?.name ?? c.ingredient?.internal_name ?? '—'}
                                  </td>
                                  <td className="px-5 py-2.5">
                                    {c.sub_recipe ? (
                                      <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">Sub-Recipe</span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Ingredient</span>
                                    )}
                                  </td>
                                  <td className="px-5 py-2.5 font-mono text-gray-700">{c.quantity}</td>
                                  <td className="px-5 py-2.5 text-gray-600">{c.unit}</td>
                                  <td className="px-5 py-2.5 text-gray-500 text-xs">{c.sub_recipe?.station_tag ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {/* Instructions */}
                        {(meal.cooking_instructions || meal.heating_instructions || meal.packaging_instructions) && (
                          <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 space-y-2">
                            {meal.cooking_instructions && (
                              <div>
                                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-0.5">Cooking Instructions</p>
                                <p className="text-sm text-amber-900 whitespace-pre-line">{meal.cooking_instructions}</p>
                              </div>
                            )}
                            {meal.heating_instructions && (
                              <div>
                                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-0.5">Heating Instructions</p>
                                <p className="text-sm text-amber-900 whitespace-pre-line">{meal.heating_instructions}</p>
                              </div>
                            )}
                            {meal.packaging_instructions && (
                              <div>
                                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-0.5">Packaging Instructions</p>
                                <p className="text-sm text-amber-900 whitespace-pre-line">{meal.packaging_instructions}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">No meals found</div>
          )}
        </div>
      )}
    </div>
  );
}

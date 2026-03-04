'use client';

import { useState } from 'react';
import { apiExtra, PrepSheetSubRecipe } from '../../../lib/api';

const PRIORITY_COLOR: Record<number, string> = {
  1: 'bg-red-100 text-red-700 border-red-200',
  2: 'bg-orange-100 text-orange-700 border-orange-200',
  3: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  4: 'bg-blue-100 text-blue-700 border-blue-200',
  5: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function SubRecipesReportPage() {
  const [filterDay, setFilterDay] = useState('');
  const [grouped, setGrouped] = useState<Record<string, PrepSheetSubRecipe[]>>({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const DAYS = ['AM', 'Tue', 'Wed', 'Fri', 'PM'];

  async function load() {
    setLoading(true);
    try {
      const data = await apiExtra.getPrepSheet(undefined, filterDay || undefined);
      setGrouped(data);
      setLoaded(true);
      const allIds = new Set<string>();
      Object.values(data).flat().forEach((sr) => allIds.add(sr.id));
      setExpandedIds(allIds);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalSubRecipes = Object.values(grouped).reduce((s, a) => s + a.length, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Recipes Prep Sheet</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kitchen production preparation by station</p>
        </div>
        {loaded && (
          <button onClick={() => window.print()} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
            Print Report
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Production Day</label>
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-40"
          >
            <option value="">All Days</option>
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-5 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading...' : 'Generate Prep Sheet'}
        </button>
      </div>

      {loaded && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Total Sub-Recipes</p>
              <p className="text-2xl font-bold text-gray-900">{totalSubRecipes}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Stations</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(grouped).length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Filter</p>
              <p className="text-sm font-medium text-gray-700">{filterDay ? `Day: ${filterDay}` : 'All production days'}</p>
            </div>
          </div>

          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([station, items]) => (
            <div key={station} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">{station}</h2>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{items.length} sub-recipes</span>
              </div>
              <div className="space-y-2">
                {items.map((sr) => (
                  <div key={sr.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => toggleExpand(sr.id)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${PRIORITY_COLOR[sr.priority ?? 3] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          P{sr.priority ?? 3}
                        </span>
                        <span className="font-semibold text-gray-900">{sr.name}</span>
                        <span className="text-xs text-gray-400 font-mono">{sr.sub_recipe_code}</span>
                        {sr.production_day && (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">{sr.production_day}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{sr.components.length} ingredients</span>
                        <span className="text-gray-400 text-xs">{expandedIds.has(sr.id) ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {expandedIds.has(sr.id) && (
                      <div className="border-t border-gray-100">
                        {sr.components.length > 0 && (
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ingredient</th>
                                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trim %</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {sr.components.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                  <td className="px-5 py-2 font-medium text-gray-800">
                                    {c.ingredient?.internal_name ?? c.child_sub_recipe?.name ?? '—'}
                                    {c.child_sub_recipe && <span className="ml-1 text-xs text-purple-600">(sub-recipe)</span>}
                                  </td>
                                  <td className="px-5 py-2 text-gray-700 font-mono">{c.quantity}</td>
                                  <td className="px-5 py-2 text-gray-600">{c.unit}</td>
                                  <td className="px-5 py-2 text-gray-600">{c.trim_percentage > 0 ? `${c.trim_percentage}%` : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {sr.instructions && (
                          <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                            <p className="text-xs font-semibold text-amber-800 mb-1 uppercase tracking-wide">Prep Instructions</p>
                            <p className="text-sm text-amber-900 whitespace-pre-line">{sr.instructions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {!loaded && !loading && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">Select a day filter and click Generate Prep Sheet</p>
        </div>
      )}
    </div>
  );
}

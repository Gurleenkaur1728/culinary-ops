'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, SubRecipe } from '../../lib/api';

const STATIONS = ['Veg', 'Sauce', 'Oven', 'Pro', 'Packing', 'Breakfast', 'Batch'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function SubRecipesPage() {
  const [data, setData] = useState<SubRecipe[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [station, setStation] = useState('');
  const [day, setDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSubRecipes({ search, station, day, take: 100 });
      setData(res.data);
      setTotal(res.total);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, station, day]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1A1A18]">Sub-Recipes</h1>
          <p className="text-[#7A9080] text-sm mt-0.5">{total} total sub-recipes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-4 mb-4 flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search sub-recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 bg-white border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
        />
        <select
          value={station}
          onChange={(e) => setStation(e.target.value)}
          className="px-3 py-2 bg-white border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
        >
          <option value="">All Stations</option>
          {STATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="px-3 py-2 bg-white border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
        >
          <option value="">All Days</option>
          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1B4332] text-[#B7E4C7]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-8"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Station</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Day</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Pri</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Ingredients</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[#7A9080]">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[#7A9080]">No sub-recipes found</td></tr>
            ) : (
              data.map((sr) => (
                <>
                  <tr
                    key={sr.id}
                    className="border-b border-[#E0EAE2] hover:bg-[#F5F0E8] cursor-pointer transition-colors"
                    onClick={() => toggleExpand(sr.id)}
                  >
                    <td className="px-4 py-3 text-[#7A9080]">{expanded === sr.id ? '▼' : '▶'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-[#D8F3DC] border border-[#B7E4C7] rounded px-1.5 py-0.5 text-[#1B4332]">#{sr.id}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1A1A18]">{sr.name}</td>
                    <td className="px-4 py-3">
                      {sr.station && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-[#B7E4C7] text-[#1B4332] font-medium">{sr.station}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#7A9080] text-xs">{sr.day || '—'}</td>
                    <td className="px-4 py-3 text-[#7A9080] text-xs">{sr.priority ?? '—'}</td>
                    <td className="px-4 py-3 text-[#7A9080] text-xs">{sr.ingredients?.length ?? 0}</td>
                  </tr>
                  {expanded === sr.id && (
                    <tr key={`${sr.id}-detail`} className="bg-[#F5F0E8] border-b border-[#E0EAE2]">
                      <td colSpan={7} className="px-8 py-4">
                        {sr.ingredients && sr.ingredients.length > 0 ? (
                          <div>
                            <p className="text-xs font-semibold text-[#7A9080] uppercase tracking-wider mb-2">Ingredients</p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-[#7A9080]">
                                  <th className="text-left py-1 pr-4 font-medium">Ingredient</th>
                                  <th className="text-left py-1 pr-4 font-medium">Weight</th>
                                  <th className="text-left py-1 pr-4 font-medium">Unit</th>
                                  <th className="text-left py-1 font-medium">Trim %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sr.ingredients.map((ing) => (
                                  <tr key={ing.id} className="border-t border-[#E0EAE2]">
                                    <td className="py-1.5 pr-4 font-medium text-[#1A1A18]">{ing.ingredient.name}</td>
                                    <td className="py-1.5 pr-4 text-[#7A9080]">{ing.weight ?? '—'}</td>
                                    <td className="py-1.5 pr-4 text-[#7A9080]">{ing.unit ?? '—'}</td>
                                    <td className="py-1.5 text-[#7A9080]">{ing.trimPct != null ? `${ing.trimPct}%` : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : <p className="text-xs text-[#7A9080]">No ingredients</p>}
                        {sr.prepInstructions && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-[#7A9080] uppercase tracking-wider mb-1">Prep Instructions</p>
                            <p className="text-xs text-[#1A1A18] whitespace-pre-wrap bg-white border border-[#E0EAE2] rounded p-2">{sr.prepInstructions}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

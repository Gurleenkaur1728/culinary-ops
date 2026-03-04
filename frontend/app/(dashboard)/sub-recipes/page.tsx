'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, SubRecipe } from '../../lib/api';

const PRIORITY_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: 'P1', color: 'bg-red-100 text-red-700' },
  2: { label: 'P2', color: 'bg-orange-100 text-orange-700' },
  3: { label: 'P3', color: 'bg-yellow-100 text-yellow-700' },
  4: { label: 'P4', color: 'bg-blue-100 text-blue-700' },
  5: { label: 'P5', color: 'bg-gray-100 text-gray-600' },
};

export default function SubRecipesPage() {
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [stationTags, setStationTags] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [data, tags] = await Promise.all([
        api.getSubRecipes(filterStation || undefined),
        api.getStationTags(),
      ]);
      setSubRecipes(data);
      setStationTags(tags as string[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterStation]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this sub-recipe?')) return;
    try {
      await api.deleteSubRecipe(id);
      load();
    } catch (e: any) { alert(e.message); }
  }

  const DAYS = ['AM', 'Tue', 'Wed', 'Fri', 'PM'];

  const filtered = subRecipes.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.sub_recipe_code.toLowerCase().includes(search.toLowerCase());
    const matchDay = !filterDay || s.production_day === filterDay;
    return matchSearch && matchDay;
  });

  // Group by station for count display
  const stationCounts = subRecipes.reduce((acc, sr) => {
    const key = sr.station_tag ?? 'Unassigned';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Recipes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subRecipes.length} total</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/sub-recipes" className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Prep Sheet
          </Link>
          <Link href="/sub-recipes/new" className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors">
            + New Sub-Recipe
          </Link>
        </div>
      </div>

      {/* Station summary pills */}
      {!loading && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setFilterStation('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterStation === '' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({subRecipes.length})
          </button>
          {Object.entries(stationCounts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([station, count]) => (
              <button
                key={station}
                onClick={() => setFilterStation(filterStation === station ? '' : station)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterStation === station ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {station} ({count})
              </button>
            ))}
        </div>
      )}

      {/* Search + Day filter */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-40"
        >
          <option value="">All days</option>
          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Priority', 'Name', 'Station', 'Day', 'Ingredients', 'Cost', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No sub-recipes found</td></tr>
            ) : (
              filtered.map((sr) => {
                const p = PRIORITY_LABEL[(sr as any).priority ?? 3] ?? PRIORITY_LABEL[3];
                return (
                  <tr key={sr.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.color}`}>{p.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{sr.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{sr.sub_recipe_code}</p>
                    </td>
                    <td className="px-4 py-3">
                      {sr.station_tag ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs">{sr.station_tag}</span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{sr.production_day ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">{sr.components.length} items</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">${sr.computed_cost.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/sub-recipes/${sr.id}`} className="text-xs text-brand-600 hover:underline">Edit</Link>
                        <button onClick={() => handleDelete(sr.id)} className="text-xs text-red-500 hover:underline">Delete</button>
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

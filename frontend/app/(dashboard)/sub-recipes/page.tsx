'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, SubRecipe } from '../../lib/api';

export default function SubRecipesPage() {
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStation, setFilterStation] = useState('');
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
    } catch (e: any) {
      alert(e.message);
    }
  }

  const filtered = subRecipes.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.sub_recipe_code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sub-Recipes</h1>
        <Link
          href="/sub-recipes/new"
          className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
        >
          + New Sub-Recipe
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={filterStation}
          onChange={(e) => setFilterStation(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All stations</option>
          {stationTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Code', 'Station', 'Prod Day', 'Yield (g)', 'Cost', 'Components', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No sub-recipes found</td></tr>
            ) : (
              filtered.map((sr) => (
                <tr key={sr.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{sr.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{sr.sub_recipe_code}</td>
                  <td className="px-4 py-3">
                    {sr.station_tag ? (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs">{sr.station_tag}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{sr.production_day ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-900">{sr.base_yield_weight}g</td>
                  <td className="px-4 py-3 font-medium text-gray-900">${sr.computed_cost.toFixed(4)}</td>
                  <td className="px-4 py-3 text-gray-500">{sr.components.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/sub-recipes/${sr.id}`} className="text-xs text-brand-600 hover:underline">Edit</Link>
                      <button onClick={() => handleDelete(sr.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

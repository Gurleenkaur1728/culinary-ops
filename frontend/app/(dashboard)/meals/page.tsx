'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, Meal } from '../../lib/api';

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const c = category.toLowerCase();
  const cls =
    c === 'meat'      ? 'bg-orange-50 text-orange-700 border border-orange-200' :
    c === 'veg'       ? 'bg-green-50 text-green-700 border border-green-200' :
    c.includes('breakie') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
    c.includes('granola') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
    c.includes('propack') ? 'bg-purple-50 text-purple-700 border border-purple-200' :
    c.includes('cookies') ? 'bg-pink-50 text-pink-700 border border-pink-200' :
    'bg-gray-50 text-gray-700 border border-gray-200';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {category}
    </span>
  );
}

export default function MealsPage() {
  const router = useRouter();
  const [data, setData] = useState<Meal[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMealCategories().then(setCategories).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getMeals({ search, category, take: 200 });
      setData(res.data);
      setTotal(res.total);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1A1A18]">Meals</h1>
          <p className="text-[#7A9080] text-sm mt-0.5">{total} meals</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-4 mb-4 flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search meals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 bg-white border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 bg-white border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1B4332] text-[#B7E4C7]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Sub-Recipes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0EAE2]">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[#7A9080]">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[#7A9080]">No meals found</td></tr>
            ) : (
              data.map((meal) => (
                <tr
                  key={meal.id}
                  onClick={() => router.push(`/meals/${meal.id}`)}
                  className="hover:bg-[#F5F0E8] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-[#D8F3DC] border border-[#B7E4C7] rounded px-1.5 py-0.5 text-[#1B4332]">
                      #{meal.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1A1A18]">{meal.name}</td>
                  <td className="px-4 py-3"><CategoryBadge category={meal.category} /></td>
                  <td className="px-4 py-3 text-[#7A9080]">{meal.price || '—'}</td>
                  <td className="px-4 py-3 text-[#7A9080]">{meal._count?.subRecipes ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

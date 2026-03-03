'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, PlanWithItems, Meal, PlanItem } from '../../../lib/api';

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const c = category.toLowerCase();
  const cls =
    c === 'meat' ? 'bg-orange-50 text-orange-700' :
    c === 'veg'  ? 'bg-green-50 text-green-700' :
    c.includes('breakie') ? 'bg-blue-50 text-blue-700' :
    c.includes('granola') ? 'bg-amber-50 text-amber-700' :
    'bg-gray-100 text-gray-600';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>{category}</span>;
}

export default function PlannerEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Plan state
  const [plan, setPlan] = useState<PlanWithItems | null>(null);
  const [planName, setPlanName] = useState('');
  const [weekLabel, setWeekLabel] = useState('');
  const [status, setStatus] = useState('draft');
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Meal browser state
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealsTotal, setMealsTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [mealsLoading, setMealsLoading] = useState(true);

  // Plan items (local cart)
  const [items, setItems] = useState<Map<string, PlanItem>>(new Map());

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metaSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load plan
  useEffect(() => {
    if (!id) return;
    api.getPlan(id).then((p) => {
      setPlan(p);
      setPlanName(p.name);
      setWeekLabel(p.weekLabel || '');
      setStatus(p.status);
      setNotes(p.notes || '');
      const itemMap = new Map<string, PlanItem>();
      p.items.forEach((item) => itemMap.set(item.mealId, item));
      setItems(itemMap);
    }).catch(() => router.push('/planner'));
  }, [id, router]);

  // Load meals
  const loadMeals = useCallback(async () => {
    setMealsLoading(true);
    try {
      const res = await api.getMeals({ search, category: categoryFilter, take: 200 });
      setMeals(res.data);
      setMealsTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setMealsLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    const t = setTimeout(loadMeals, 300);
    return () => clearTimeout(t);
  }, [loadMeals]);

  // Load categories
  useEffect(() => {
    api.getMealCategories().then(setCategories).catch(() => {});
  }, []);

  // Auto-save plan metadata
  function scheduleSaveMeta() {
    setSaveStatus('saving');
    if (metaSaveTimeout.current) clearTimeout(metaSaveTimeout.current);
    metaSaveTimeout.current = setTimeout(async () => {
      try {
        await api.updatePlan(id, { name: planName, weekLabel, status, notes });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        setSaveStatus('idle');
      }
    }, 800);
  }

  useEffect(() => {
    if (!plan) return;
    scheduleSaveMeta();
  }, [planName, weekLabel, status, notes]);

  // Add or update meal in plan
  async function setQuantity(meal: Meal, qty: number) {
    if (qty <= 0) {
      // Remove
      const prev = new Map(items);
      prev.delete(meal.id);
      setItems(prev);
      await api.removePlanItem(id, meal.id).catch(() => {});
    } else {
      // Upsert locally
      const prev = new Map(items);
      const existing = prev.get(meal.id);
      prev.set(meal.id, {
        id: existing?.id || '',
        planId: id,
        mealId: meal.id,
        quantity: qty,
        meal: { id: meal.id, name: meal.name, category: meal.category, price: meal.price },
      });
      setItems(prev);

      // Debounce save
      setSaveStatus('saving');
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        try {
          await api.upsertPlanItem(id, meal.id, qty);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
          setSaveStatus('idle');
        }
      }, 800);
    }
  }

  function getQty(mealId: string): number {
    return items.get(mealId)?.quantity ?? 0;
  }

  const cartItems = Array.from(items.values()).sort((a, b) => a.meal.name.localeCompare(b.meal.name));
  const totalPortions = cartItems.reduce((s, i) => s + i.quantity, 0);

  if (!plan) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[#7A9080]">Loading plan...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ─── LEFT: Plan details ──────────────────────────────── */}
      <div className="w-64 flex-shrink-0 bg-[#FDFAF5] border-r border-[#E0EAE2] flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-[#E0EAE2]">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push('/planner')}
              className="text-xs text-[#7A9080] hover:text-[#1B4332] transition-colors"
            >
              ← Plans
            </button>
            <span className={`text-xs ${
              saveStatus === 'saved' ? 'text-[#52B788]' :
              saveStatus === 'saving' ? 'text-[#7A9080]' : 'text-transparent'
            }`}>
              {saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'saving' ? 'Saving...' : '·'}
            </span>
          </div>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="w-full font-display font-semibold text-[#1A1A18] bg-transparent border-0 border-b border-[#E0EAE2] pb-1 mb-3 text-sm focus:outline-none focus:border-[#52B788]"
            placeholder="Plan name..."
          />
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] text-[#7A9080] uppercase tracking-wider mb-0.5">Week</label>
              <input
                type="text"
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                placeholder="e.g. Week of March 3"
                className="w-full px-2 py-1 text-xs border border-[#E0EAE2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#52B788]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#7A9080] uppercase tracking-wider mb-0.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-[#E0EAE2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#52B788]"
              >
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#7A9080] uppercase tracking-wider mb-0.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-2 py-1 text-xs border border-[#E0EAE2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#52B788] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="p-4">
          <p className="text-[10px] text-[#7A9080] uppercase tracking-wider mb-2">Filter by Category</p>
          <div className="space-y-1">
            <button
              onClick={() => setCategoryFilter('')}
              className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${categoryFilter === '' ? 'bg-[#D8F3DC] text-[#1B4332] font-medium' : 'text-[#7A9080] hover:bg-[#F5F0E8]'}`}
            >
              All Meals
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c === categoryFilter ? '' : c)}
                className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${categoryFilter === c ? 'bg-[#D8F3DC] text-[#1B4332] font-medium' : 'text-[#7A9080] hover:bg-[#F5F0E8]'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CENTER: Meal browser ───────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-[#E0EAE2] bg-[#FDFAF5]">
          <input
            type="text"
            placeholder="Search meals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
          />
          <p className="text-xs text-[#7A9080] mt-1">{mealsTotal} meals</p>
        </div>

        {/* Meal grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {mealsLoading ? (
            <p className="text-center text-[#7A9080] py-8">Loading meals...</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {meals.map((meal) => {
                const qty = getQty(meal.id);
                const inPlan = qty > 0;
                return (
                  <div
                    key={meal.id}
                    className={`bg-white border rounded-[10px] p-3 transition-all ${
                      inPlan
                        ? 'border-[#52B788] bg-[#F5F0E8]'
                        : 'border-[#E0EAE2] hover:border-[#B7E4C7]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#1A1A18] leading-snug truncate">{meal.name}</p>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <CategoryBadge category={meal.category} />
                          {meal.price && <span className="text-[10px] text-[#7A9080]">{meal.price}</span>}
                        </div>
                      </div>
                    </div>
                    {inPlan ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuantity(meal, qty - 1)}
                          className="w-6 h-6 rounded-full bg-[#1B4332] text-white text-sm flex items-center justify-center hover:bg-[#2D6A4F]"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) => setQuantity(meal, parseInt(e.target.value) || 0)}
                          className="w-12 text-center text-sm font-semibold border border-[#E0EAE2] rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-[#52B788]"
                        />
                        <button
                          onClick={() => setQuantity(meal, qty + 1)}
                          className="w-6 h-6 rounded-full bg-[#1B4332] text-white text-sm flex items-center justify-center hover:bg-[#2D6A4F]"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setQuantity(meal, 1)}
                        className="w-full text-xs py-1 bg-[#D8F3DC] text-[#1B4332] rounded-lg hover:bg-[#B7E4C7] transition-colors font-medium"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT: Plan cart ───────────────────────────────── */}
      <div className="w-72 flex-shrink-0 bg-[#FDFAF5] border-l border-[#E0EAE2] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#E0EAE2]">
          <h2 className="font-display font-semibold text-[#1A1A18] text-sm">
            Plan ({cartItems.length} meals)
          </h2>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-[#7A9080]">No meals added yet</p>
              <p className="text-xs text-[#7A9080] mt-1">Click "Add" on a meal to include it</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E0EAE2]">
              {cartItems.map((item) => (
                <div key={item.mealId} className="px-4 py-2.5 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1A18] truncate">{item.meal.name}</p>
                    {item.meal.category && (
                      <p className="text-[10px] text-[#7A9080]">{item.meal.category}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const meal = meals.find((m) => m.id === item.mealId);
                        if (meal) setQuantity(meal, item.quantity - 1);
                        else {
                          // Remove directly if meal not in browser
                          const prev = new Map(items);
                          prev.delete(item.mealId);
                          setItems(prev);
                          api.removePlanItem(id, item.mealId).catch(() => {});
                        }
                      }}
                      className="w-5 h-5 text-[10px] rounded bg-[#E0EAE2] hover:bg-[#B7E4C7] text-[#1A1A18] flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => {
                        const meal = meals.find((m) => m.id === item.mealId);
                        if (meal) setQuantity(meal, item.quantity + 1);
                        else {
                          const prev = new Map(items);
                          const existing = prev.get(item.mealId);
                          if (existing) {
                            prev.set(item.mealId, { ...existing, quantity: existing.quantity + 1 });
                            setItems(prev);
                            api.upsertPlanItem(id, item.mealId, existing.quantity + 1).catch(() => {});
                          }
                        }
                      }}
                      className="w-5 h-5 text-[10px] rounded bg-[#E0EAE2] hover:bg-[#B7E4C7] text-[#1A1A18] flex items-center justify-center"
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        const prev = new Map(items);
                        prev.delete(item.mealId);
                        setItems(prev);
                        api.removePlanItem(id, item.mealId).catch(() => {});
                      }}
                      className="text-[#D64E2A] text-xs hover:opacity-70 ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="border-t border-[#E0EAE2] p-4">
          <div className="space-y-1 mb-4 text-xs">
            <div className="flex justify-between">
              <span className="text-[#7A9080]">Meal types</span>
              <span className="font-semibold text-[#1A1A18]">{cartItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A9080]">Total portions</span>
              <span className="font-semibold text-[#1A1A18]">{totalPortions}</span>
            </div>
          </div>

          {/* Report buttons */}
          <div className="space-y-2">
            <Link
              href={`/reports/cooking?planId=${id}`}
              className="flex items-center gap-2 w-full px-3 py-2 bg-[#1B4332] text-white text-xs font-medium rounded-lg hover:bg-[#2D6A4F] transition-colors"
            >
              <span>📊</span> Cooking Report
            </Link>
            <Link
              href={`/reports/shopping-list?planId=${id}`}
              className="flex items-center gap-2 w-full px-3 py-2 bg-[#2D6A4F] text-white text-xs font-medium rounded-lg hover:bg-[#1B4332] transition-colors"
            >
              <span>🛒</span> Shopping List
            </Link>
            <Link
              href={`/reports/sub-recipes?planId=${id}`}
              className="flex items-center gap-2 w-full px-3 py-2 border border-[#E0EAE2] text-[#1A1A18] text-xs font-medium rounded-lg hover:bg-[#F5F0E8] transition-colors"
            >
              <span>🍲</span> SR Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

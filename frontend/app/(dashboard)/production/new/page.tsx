'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, MealRecipe } from '../../../lib/api';

interface PlanItem {
  meal_id: string;
  display_name: string;
  category: string | null;
  quantity: number;
}

export default function NewProductionPlanPage() {
  const router = useRouter();
  const [meals, setMeals] = useState<MealRecipe[]>([]);
  const [weekLabel, setWeekLabel] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<PlanItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMeals().then(setMeals).catch(() => {});
    // Default week start to next Monday
    const today = new Date();
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    const iso = nextMonday.toISOString().split('T')[0];
    setWeekStart(iso);
    const end = new Date(nextMonday);
    end.setDate(nextMonday.getDate() + 6);
    setWeekLabel(
      `${nextMonday.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    );
  }, []);

  const filtered = meals.filter(
    (m) =>
      !items.find((i) => i.meal_id === m.id) &&
      (m.display_name.toLowerCase().includes(search.toLowerCase()) ||
        m.name.toLowerCase().includes(search.toLowerCase())),
  );

  function addMeal(meal: MealRecipe) {
    setItems((prev) => [...prev, { meal_id: meal.id, display_name: meal.display_name, category: (meal as any).category ?? null, quantity: 0 }]);
    setSearch('');
  }

  function removeItem(meal_id: string) {
    setItems((prev) => prev.filter((i) => i.meal_id !== meal_id));
  }

  function updateQty(meal_id: string, qty: number) {
    setItems((prev) => prev.map((i) => (i.meal_id === meal_id ? { ...i, quantity: Math.max(0, qty) } : i)));
  }

  async function handleCreate() {
    if (!weekLabel.trim() || !weekStart) {
      alert('Week label and start date are required.');
      return;
    }
    setSaving(true);
    try {
      const plan = await api.createProductionPlan({
        week_label: weekLabel,
        week_start: weekStart,
        notes: notes || undefined,
        items: items.map((i) => ({ meal_id: i.meal_id, quantity: i.quantity })),
      });
      router.push(`/production/${plan.id}`);
    } catch (e: any) {
      alert(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900">New Production Plan</h1>
      </div>

      {/* Plan meta */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Plan Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Week Label</label>
            <input
              type="text"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              placeholder="e.g. Jan 4 – Jan 10, 2026"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Week Start (Monday)</label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any notes about this week's plan..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>
      </div>

      {/* Meal selector */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Left: search + add meals */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Add Meals</h2>
          <input
            type="text"
            placeholder="Search meals to add..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 mb-2"
          />
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {search.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">Type to search meals</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No results</p>
            ) : (
              filtered.slice(0, 20).map((meal) => (
                <button
                  key={meal.id}
                  onClick={() => addMeal(meal)}
                  className="w-full text-left px-2 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{meal.display_name}</p>
                  {(meal as any).category && (
                    <p className="text-xs text-gray-400">{(meal as any).category}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: added meals with quantities */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Plan Items
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-normal">{items.length} meals</span>
          </h2>
          {items.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No meals added yet — search and click to add</p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {items.map((item) => (
                <div key={item.meal_id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.display_name}</p>
                    {item.category && <p className="text-xs text-gray-400">{item.category}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => updateQty(item.meal_id, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <span className="text-xs text-gray-400">qty</span>
                  </div>
                  <button onClick={() => removeItem(item.meal_id)} className="text-gray-300 hover:text-red-400 text-sm px-1">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={saving}
          className="px-6 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Creating...' : 'Create Plan'}
        </button>
      </div>
    </div>
  );
}

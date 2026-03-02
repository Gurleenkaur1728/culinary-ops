'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Ingredient, SubRecipe } from '../../../lib/api';

interface ComponentRow {
  type: 'ingredient' | 'sub_recipe';
  ref_id: string;
  quantity: number;
  unit: string;
}

export default function NewMealPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [finalYield, setFinalYield] = useState(0);
  const [pricingOverride, setPricingOverride] = useState('');
  const [components, setComponents] = useState<ComponentRow[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getIngredients(), api.getSubRecipes()]).then(([i, s]) => {
      setIngredients(i);
      setSubRecipes(s);
    });
  }, []);

  function addComponent() {
    setComponents((c) => [...c, { type: 'sub_recipe', ref_id: '', quantity: 1, unit: 'serving' }]);
  }

  function updateComponent(idx: number, field: keyof ComponentRow, value: string | number) {
    setComponents((cs) => cs.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  }

  function removeComponent(idx: number) {
    setComponents((cs) => cs.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await api.createMeal({
        name,
        display_name: displayName,
        final_yield_weight: Number(finalYield),
        pricing_override: pricingOverride ? Number(pricingOverride) : undefined,
        components: components.map((c) => ({
          ingredient_id: c.type === 'ingredient' ? c.ref_id : undefined,
          sub_recipe_id: c.type === 'sub_recipe' ? c.ref_id : undefined,
          quantity: Number(c.quantity),
          unit: c.unit,
        })),
      });
      router.push('/meals');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push('/meals')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h1 className="text-2xl font-bold text-gray-900">New Meal Recipe</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name (SKU reference)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="chicken-rice-bowl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Chicken Rice Bowl" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Final Yield Weight (g)</label>
            <input type="number" min="0" value={finalYield} onChange={(e) => setFinalYield(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price Override ($) <span className="text-gray-400 font-normal">optional</span></label>
            <input type="number" min="0" step="0.01" value={pricingOverride} onChange={(e) => setPricingOverride(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="12.99" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Components</label>
            <button onClick={addComponent} className="text-xs text-brand-600 hover:underline">+ Add Component</button>
          </div>
          {components.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
              No components yet.
            </p>
          ) : (
            <div className="space-y-2">
              {components.map((comp, idx) => (
                <div key={idx} className="grid grid-cols-[120px_1fr_80px_80px_32px] gap-2 items-center">
                  <select value={comp.type} onChange={(e) => updateComponent(idx, 'type', e.target.value as any)}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500">
                    <option value="sub_recipe">Sub-Recipe</option>
                    <option value="ingredient">Ingredient</option>
                  </select>
                  <select value={comp.ref_id} onChange={(e) => updateComponent(idx, 'ref_id', e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500">
                    <option value="">Select...</option>
                    {comp.type === 'sub_recipe'
                      ? subRecipes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)
                      : ingredients.map((i) => <option key={i.id} value={i.id}>{i.internal_name} ({i.sku})</option>)}
                  </select>
                  <input type="number" min="0" step="0.001" value={comp.quantity}
                    onChange={(e) => updateComponent(idx, 'quantity', e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  <input type="text" value={comp.unit} onChange={(e) => updateComponent(idx, 'unit', e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  <button onClick={() => removeComponent(idx)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={() => router.push('/meals')}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50">
            {saving ? 'Saving...' : 'Create Meal Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}

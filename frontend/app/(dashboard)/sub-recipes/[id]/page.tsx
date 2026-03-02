'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, SubRecipe, Ingredient } from '../../../lib/api';

interface ComponentRow {
  type: 'ingredient' | 'sub_recipe';
  ref_id: string;
  quantity: number;
  unit: string;
}

export default function EditSubRecipePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instructions, setInstructions] = useState('');
  const [productionDay, setProductionDay] = useState('');
  const [stationTag, setStationTag] = useState('');
  const [baseYield, setBaseYield] = useState(0);
  const [components, setComponents] = useState<ComponentRow[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [computedCost, setComputedCost] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getSubRecipe(id), api.getIngredients(), api.getSubRecipes()]).then(
      ([sr, ingr, subs]) => {
        setName(sr.name);
        setCode(sr.sub_recipe_code);
        setInstructions(sr.instructions ?? '');
        setProductionDay(sr.production_day ?? '');
        setStationTag(sr.station_tag ?? '');
        setBaseYield(sr.base_yield_weight);
        setComputedCost(sr.computed_cost);
        setComponents(
          sr.components.map((c) => ({
            type: c.ingredient_id ? 'ingredient' : 'sub_recipe',
            ref_id: (c.ingredient_id ?? c.child_sub_recipe_id) as string,
            quantity: c.quantity,
            unit: c.unit,
          })),
        );
        setIngredients(ingr);
        setSubRecipes(subs.filter((s) => s.id !== id));
        setLoading(false);
      },
    );
  }, [id]);

  function addComponent() {
    setComponents((c) => [...c, { type: 'ingredient', ref_id: '', quantity: 0, unit: 'g' }]);
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
      await api.updateSubRecipe(id, {
        name,
        sub_recipe_code: code,
        instructions: instructions || undefined,
        production_day: productionDay || undefined,
        station_tag: stationTag || undefined,
        base_yield_weight: Number(baseYield),
        components: components.map((c) => ({
          ingredient_id: c.type === 'ingredient' ? c.ref_id : undefined,
          child_sub_recipe_id: c.type === 'sub_recipe' ? c.ref_id : undefined,
          quantity: Number(c.quantity),
          unit: c.unit,
        })),
      });
      router.push('/sub-recipes');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push('/sub-recipes')} className="text-gray-400 hover:text-gray-600 text-lg">
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Sub-Recipe</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Computed cost: <span className="font-semibold text-gray-900">${computedCost.toFixed(4)}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Yield (g)</label>
            <input type="number" min="0" value={baseYield} onChange={(e) => setBaseYield(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Station Tag</label>
            <input type="text" value={stationTag} onChange={(e) => setStationTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Production Day</label>
            <input type="text" value={productionDay} onChange={(e) => setProductionDay(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Components</label>
            <button onClick={addComponent} className="text-xs text-brand-600 hover:underline">+ Add</button>
          </div>
          {components.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">No components</p>
          ) : (
            <div className="space-y-2">
              {components.map((comp, idx) => (
                <div key={idx} className="grid grid-cols-[120px_1fr_80px_80px_32px] gap-2 items-center">
                  <select value={comp.type} onChange={(e) => updateComponent(idx, 'type', e.target.value as any)}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500">
                    <option value="ingredient">Ingredient</option>
                    <option value="sub_recipe">Sub-Recipe</option>
                  </select>
                  <select value={comp.ref_id} onChange={(e) => updateComponent(idx, 'ref_id', e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500">
                    <option value="">Select...</option>
                    {comp.type === 'ingredient'
                      ? ingredients.map((i) => <option key={i.id} value={i.id}>{i.internal_name} ({i.sku})</option>)
                      : subRecipes.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.sub_recipe_code})</option>)}
                  </select>
                  <input type="number" min="0" step="0.001" value={comp.quantity}
                    onChange={(e) => updateComponent(idx, 'quantity', e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="Qty" />
                  <input type="text" value={comp.unit} onChange={(e) => updateComponent(idx, 'unit', e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="g" />
                  <button onClick={() => removeComponent(idx)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={() => router.push('/sub-recipes')}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

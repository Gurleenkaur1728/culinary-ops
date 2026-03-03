'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, SubRecipe, Ingredient, SRIngredient } from '../../../lib/api';

interface IngredientRow {
  ingredientId: string;
  weight: number | '';
  unit: string;
  trimPct: number | '';
}

const STATIONS = ['Veg', 'Sauce', 'Oven', 'Pro', 'Packing', 'Breakfast', 'Batch'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function EditSubRecipePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [station, setStation] = useState('');
  const [day, setDay] = useState('');
  const [priority, setPriority] = useState<number | ''>('');
  const [prepInstructions, setPrepInstructions] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [baseWeight, setBaseWeight] = useState<number | ''>('');
  const [baseUnit, setBaseUnit] = useState('');
  const [rows, setRows] = useState<IngredientRow[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getSubRecipe(id), api.getIngredients({ take: 2000 })]).then(
      ([sr, ingRes]) => {
        setName(sr.name);
        setStation(sr.station ?? '');
        setDay(sr.day ?? '');
        setPriority(sr.priority ?? '');
        setPrepInstructions(sr.prepInstructions ?? '');
        setBackendUrl(sr.backendUrl ?? '');
        setBaseWeight(sr.baseWeight ?? '');
        setBaseUnit(sr.baseUnit ?? '');
        setRows(
          sr.ingredients.map((ing) => ({
            ingredientId: ing.ingredientId,
            weight: ing.weight ?? '',
            unit: ing.unit ?? 'gr',
            trimPct: ing.trimPct ?? '',
          })),
        );
        setAllIngredients(ingRes.data);
        setLoading(false);
      },
    ).catch(() => router.push('/sub-recipes'));
  }, [id, router]);

  function addRow() {
    setRows((r) => [...r, { ingredientId: '', weight: '', unit: 'gr', trimPct: '' }]);
  }

  function updateRow(idx: number, field: keyof IngredientRow, value: string | number) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function removeRow(idx: number) {
    setRows((rs) => rs.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await api.updateSubRecipe(id, {
        name: name.trim(),
        station: station || undefined,
        day: day || undefined,
        priority: priority !== '' ? Number(priority) : undefined,
        prepInstructions: prepInstructions || undefined,
        backendUrl: backendUrl || undefined,
        baseWeight: baseWeight !== '' ? Number(baseWeight) : undefined,
        baseUnit: baseUnit || undefined,
        ingredients: rows
          .filter((r) => r.ingredientId)
          .map((r) => ({
            ingredientId: r.ingredientId,
            weight: r.weight !== '' ? Number(r.weight) : undefined,
            unit: r.unit || undefined,
            trimPct: r.trimPct !== '' ? Number(r.trimPct) : undefined,
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
      <div className="p-8 flex items-center justify-center">
        <p className="text-[#7A9080]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push('/sub-recipes')} className="text-[#7A9080] hover:text-[#1B4332] text-lg">←</button>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1A1A18]">Edit Sub-Recipe</h1>
          <p className="font-mono text-xs text-[#7A9080] mt-0.5">#{id}</p>
        </div>
      </div>

      <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-[#7A9080] uppercase tracking-wider mb-1">Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
        </div>

        {/* Station / Day / Priority */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#7A9080] uppercase tracking-wider mb-1">Station</label>
            <select value={station} onChange={(e) => setStation(e.target.value)}
              className="w-full px-3 py-2 border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]">
              <option value="">— None —</option>
              {STATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7A9080] uppercase tracking-wider mb-1">Production Day</label>
            <select value={day} onChange={(e) => setDay(e.target.value)}
              className="w-full px-3 py-2 border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]">
              <option value="">— None —</option>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7A9080] uppercase tracking-wider mb-1">Priority</label>
            <input type="number" min="1" value={priority}
              onChange={(e) => setPriority(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
          </div>
        </div>

        {/* Base weight */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#7A9080] uppercase tracking-wider mb-1">Base Batch Weight</label>
            <input type="number" min="0" value={baseWeight}
              onChange={(e) => setBaseWeight(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7A9080] uppercase tracking-wider mb-1">Base Unit</label>
            <input type="text" value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)}
              className="w-full px-3 py-2 border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
          </div>
        </div>

        {/* Prep instructions */}
        <div>
          <label className="block text-xs font-medium text-[#7A9080] uppercase tracking-wider mb-1">Prep Instructions</label>
          <textarea value={prepInstructions} onChange={(e) => setPrepInstructions(e.target.value)} rows={4}
            className="w-full px-3 py-2 border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788] resize-none font-mono" />
        </div>

        {/* Backend URL */}
        <div>
          <label className="block text-xs font-medium text-[#7A9080] uppercase tracking-wider mb-1">Backend URL</label>
          <input type="text" value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)}
            className="w-full px-3 py-2 border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-[#7A9080] uppercase tracking-wider">
              Ingredients ({rows.length})
            </label>
            <button onClick={addRow} className="text-xs text-[#52B788] hover:underline font-medium">+ Add Row</button>
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-[#7A9080] py-4 text-center border border-dashed border-[#E0EAE2] rounded-lg">
              No ingredients linked.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_70px_70px_32px] gap-2 px-1">
                {['Ingredient', 'Weight', 'Unit', 'Trim %', ''].map((h) => (
                  <span key={h} className="text-[10px] text-[#7A9080] uppercase tracking-wider font-medium">{h}</span>
                ))}
              </div>
              {rows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_70px_70px_32px] gap-2 items-center">
                  <select value={row.ingredientId} onChange={(e) => updateRow(idx, 'ingredientId', e.target.value)}
                    className="px-2 py-1.5 border border-[#E0EAE2] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#52B788] bg-white">
                    <option value="">Select...</option>
                    {allIngredients.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                  <input type="number" min="0" step="0.001" value={row.weight}
                    onChange={(e) => updateRow(idx, 'weight', e.target.value ? Number(e.target.value) : '')}
                    className="px-2 py-1.5 border border-[#E0EAE2] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#52B788]" />
                  <input type="text" value={row.unit} onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                    className="px-2 py-1.5 border border-[#E0EAE2] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#52B788]" />
                  <input type="number" min="0" max="100" step="0.1" value={row.trimPct}
                    onChange={(e) => updateRow(idx, 'trimPct', e.target.value ? Number(e.target.value) : '')}
                    className="px-2 py-1.5 border border-[#E0EAE2] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#52B788]" />
                  <button onClick={() => removeRow(idx)} className="text-[#D64E2A] hover:opacity-70 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={() => router.push('/sub-recipes')}
            className="px-4 py-2 border border-[#E0EAE2] text-[#7A9080] text-sm rounded-lg hover:bg-[#F5F0E8]">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-[#1B4332] text-white text-sm font-medium rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

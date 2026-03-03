'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Meal, MealSubRecipe } from '../../../lib/api';

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const c = category.toLowerCase();
  const cls =
    c === 'meat' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
    c === 'veg'  ? 'bg-green-50 text-green-700 border border-green-200' :
    c.includes('breakie') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
    c.includes('granola') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
    'bg-gray-50 text-gray-700 border border-gray-200';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{category}</span>;
}

function SRCard({ msr, defaultExpanded }: { msr: MealSubRecipe; defaultExpanded?: boolean }) {
  const [open, setOpen] = useState(defaultExpanded ?? false);
  const [showPrep, setShowPrep] = useState(false);
  const sr = msr.subRecipe;

  return (
    <div className="border border-[#E0EAE2] rounded-[14px] bg-white overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F5F0E8] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-[#7A9080] text-xs">{open ? '▼' : '▶'}</span>
        <span className="font-mono text-xs bg-[#D8F3DC] border border-[#B7E4C7] rounded px-1.5 py-0.5 text-[#1B4332]">
          #{sr.id}
        </span>
        <span className="font-medium text-[#1A1A18] flex-1">{sr.name}</span>
        {msr.perPortion != null && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-[#D8F3DC] text-[#1B4332] font-medium">
            {msr.perPortion} {msr.unit || ''}
          </span>
        )}
        {sr.station && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-[#B7E4C7] text-[#1B4332]">{sr.station}</span>
        )}
        {sr.day && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{sr.day}</span>
        )}
        {sr.priority != null && (
          <span className="px-2 py-0.5 rounded-full text-xs border border-[#E0EAE2] text-[#7A9080]">P{sr.priority}</span>
        )}
        {sr.backendUrl && (
          <a
            href={sr.backendUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-[#52B788] hover:underline"
          >
            ↗
          </a>
        )}
      </div>

      {open && (
        <div className="border-t border-[#E0EAE2] px-4 py-3">
          {sr.ingredients && sr.ingredients.length > 0 ? (
            <div className="mb-3">
              <p className="text-xs font-semibold text-[#7A9080] uppercase tracking-wider mb-2">Ingredients</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#7A9080]">
                    <th className="text-left py-1 pr-4 font-medium">ID</th>
                    <th className="text-left py-1 pr-4 font-medium">Ingredient</th>
                    <th className="text-left py-1 pr-4 font-medium">Batch Qty</th>
                    <th className="text-left py-1 pr-4 font-medium">Unit</th>
                    <th className="text-left py-1 font-medium">Trim %</th>
                  </tr>
                </thead>
                <tbody>
                  {sr.ingredients.map((ing) => (
                    <tr key={ing.id} className="border-t border-[#E0EAE2]">
                      <td className="py-1.5 pr-4">
                        <span className="font-mono text-[10px] bg-[#D8F3DC] border border-[#B7E4C7] rounded px-1 text-[#1B4332]">
                          #{ing.ingredientId}
                        </span>
                      </td>
                      <td className="py-1.5 pr-4 font-medium text-[#1A1A18]">{ing.ingredient.name}</td>
                      <td className="py-1.5 pr-4 text-[#7A9080]">{ing.weight ?? '—'}</td>
                      <td className="py-1.5 pr-4 text-[#7A9080]">{ing.unit ?? '—'}</td>
                      <td className="py-1.5 text-[#7A9080]">{ing.trimPct != null ? `${ing.trimPct}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[#7A9080] mb-2">No ingredients recorded</p>
          )}

          {sr.prepInstructions && (
            <div>
              <button
                onClick={() => setShowPrep(!showPrep)}
                className="text-xs text-[#52B788] hover:underline mb-2"
              >
                {showPrep ? '▼ Hide' : '▶ Show'} prep instructions
              </button>
              {showPrep && (
                <pre className="text-xs text-[#1A1A18] whitespace-pre-wrap bg-[#F5F0E8] border border-[#E0EAE2] rounded p-3 font-mono">
                  {sr.prepInstructions}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getMeal(id)
      .then(setMeal)
      .catch(() => router.push('/meals'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-[#7A9080]">Loading meal...</p>
      </div>
    );
  }

  if (!meal) return null;

  const totalIngredients = meal.subRecipes.reduce(
    (sum, msr) => sum + (msr.subRecipe.ingredients?.length ?? 0),
    0,
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[#7A9080] text-sm mb-3">
          <button onClick={() => router.push('/meals')} className="hover:text-[#1B4332] transition-colors">
            ← Meals
          </button>
          <span>/</span>
          <span>{meal.name}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#1A1A18] mb-2">{meal.name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs bg-[#D8F3DC] border border-[#B7E4C7] rounded px-1.5 py-0.5 text-[#1B4332]">
                #{meal.id}
              </span>
              <CategoryBadge category={meal.category} />
              {meal.price && (
                <span className="text-sm font-semibold text-[#1B4332]">{meal.price}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {meal.backendUrl && (
              <a
                href={meal.backendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-sm border border-[#E0EAE2] rounded-lg hover:bg-[#F5F0E8] text-[#7A9080] transition-colors"
              >
                Backend ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Sub-Recipes', value: meal.subRecipes.length },
          { label: 'Total Ingredients', value: totalIngredients },
          { label: 'Price', value: meal.price || '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-4">
            <p className="text-xs text-[#7A9080] mb-1">{label}</p>
            <p className="text-2xl font-bold text-[#1B4332]">{value}</p>
          </div>
        ))}
      </div>

      {/* Sub-Recipes Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-semibold text-[#1A1A18]">
            Sub-Recipes ({meal.subRecipes.length})
          </h2>
          <button
            onClick={() => setExpandAll(!expandAll)}
            className="text-sm text-[#52B788] hover:underline"
          >
            {expandAll ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {meal.subRecipes.length === 0 ? (
          <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-8 text-center">
            <p className="text-[#7A9080]">No sub-recipes linked to this meal</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meal.subRecipes.map((msr) => (
              <SRCard key={msr.id} msr={msr} defaultExpanded={expandAll} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

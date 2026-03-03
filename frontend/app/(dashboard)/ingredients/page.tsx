'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, Ingredient } from '../../lib/api';

export default function IngredientsPage() {
  const [data, setData] = useState<Ingredient[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Ingredient | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const res = await api.getIngredients({ search: s, take: 100 });
      setData(res.data);
      setTotal(res.total);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  async function handleSaveEdit() {
    if (!editItem) return;
    setSaving(true);
    try {
      await api.updateIngredient(editItem.id, { name: editName });
      setEditItem(null);
      load(search);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      await api.deleteIngredient(id);
      setDeleteId(null);
      load(search);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1A1A18]">Ingredients</h1>
          <p className="text-[#7A9080] text-sm mt-0.5">{total} total ingredients</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-4 mb-4">
        <input
          type="text"
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
        />
      </div>

      {/* Table */}
      <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1B4332] text-[#B7E4C7]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0EAE2]">
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-[#7A9080]">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-[#7A9080]">No ingredients found</td></tr>
            ) : (
              data.map((ing) => (
                <tr key={ing.id} className="hover:bg-[#F5F0E8] transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-[#D8F3DC] border border-[#B7E4C7] rounded px-1.5 py-0.5 text-[#1B4332]">
                      #{ing.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1A1A18]">{ing.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setEditItem(ing); setEditName(ing.name); }}
                      className="text-xs text-[#52B788] hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(ing.id)}
                      className="text-xs text-[#D64E2A] hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-6 w-96 shadow-xl">
            <h2 className="font-display text-lg font-semibold mb-4">Edit Ingredient</h2>
            <p className="text-xs text-[#7A9080] mb-2">ID: #{editItem.id}</p>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-[#E0EAE2] rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#52B788]"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 text-sm border border-[#E0EAE2] rounded-lg hover:bg-[#F5F0E8]">
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={saving} className="px-4 py-2 text-sm bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-6 w-96 shadow-xl">
            <h2 className="font-display text-lg font-semibold mb-2">Delete Ingredient?</h2>
            <p className="text-sm text-[#7A9080] mb-4">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-[#E0EAE2] rounded-lg hover:bg-[#F5F0E8]">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={saving} className="px-4 py-2 text-sm bg-[#D64E2A] text-white rounded-lg hover:opacity-90 disabled:opacity-50">
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

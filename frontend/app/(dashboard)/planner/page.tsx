'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ProductionPlan } from '../../lib/api';

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'confirmed' ? 'bg-[#D8F3DC] text-[#1B4332]' :
    status === 'completed' ? 'bg-gray-100 text-gray-500' :
    'bg-amber-50 text-amber-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

export default function PlannerPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWeek, setNewWeek] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getPlans();
      setPlans(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const plan = await api.createPlan({ name: newName, weekLabel: newWeek, status: 'draft' });
      setShowNew(false);
      setNewName('');
      setNewWeek('');
      router.push(`/planner/${plan.id}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const plan = await api.duplicatePlan(id);
      router.push(`/planner/${plan.id}`);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deletePlan(id);
      setDeleteId(null);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1A1A18]">Production Planner</h1>
          <p className="text-[#7A9080] text-sm mt-0.5">{plans.length} plans</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-[#1B4332] text-white text-sm font-medium rounded-lg hover:bg-[#2D6A4F] transition-colors"
        >
          + New Plan
        </button>
      </div>

      {/* Plans Table */}
      <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1B4332] text-[#B7E4C7]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Plan Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Week</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Meals</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0EAE2]">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#7A9080]">Loading...</td></tr>
            ) : plans.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-[#7A9080] mb-3">No plans yet</p>
                  <button
                    onClick={() => setShowNew(true)}
                    className="px-4 py-2 bg-[#1B4332] text-white text-sm rounded-lg hover:bg-[#2D6A4F]"
                  >
                    Create your first plan
                  </button>
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-[#F5F0E8] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1A1A18]">{plan.name}</td>
                  <td className="px-4 py-3 text-[#7A9080] text-sm">{plan.weekLabel || '—'}</td>
                  <td className="px-4 py-3 text-[#7A9080]">{plan._count?.items ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={plan.status} /></td>
                  <td className="px-4 py-3 text-[#7A9080] text-xs">
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => router.push(`/planner/${plan.id}`)}
                      className="text-xs text-[#1B4332] font-medium hover:underline mr-3"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDuplicate(plan.id)}
                      className="text-xs text-[#7A9080] hover:underline mr-3"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => setDeleteId(plan.id)}
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

      {/* New Plan Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-6 w-[420px] shadow-xl">
            <h2 className="font-display text-xl font-semibold mb-4">New Production Plan</h2>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-[#7A9080] mb-1 uppercase tracking-wider">Plan Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                  placeholder="e.g. Week of March 3"
                  className="w-full px-3 py-2 border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7A9080] mb-1 uppercase tracking-wider">Week Label</label>
                <input
                  type="text"
                  value={newWeek}
                  onChange={(e) => setNewWeek(e.target.value)}
                  placeholder="e.g. Week of March 3, 2026"
                  className="w-full px-3 py-2 border border-[#E0EAE2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNew(false)}
                className="px-4 py-2 text-sm border border-[#E0EAE2] rounded-lg hover:bg-[#F5F0E8]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="px-4 py-2 text-sm bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create & Open'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#FDFAF5] border border-[#E0EAE2] rounded-[14px] p-6 w-96 shadow-xl">
            <h2 className="font-display text-lg font-semibold mb-2">Delete Plan?</h2>
            <p className="text-sm text-[#7A9080] mb-4">This will permanently delete the plan and all its items.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-[#E0EAE2] rounded-lg hover:bg-[#F5F0E8]">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 text-sm bg-[#D64E2A] text-white rounded-lg hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

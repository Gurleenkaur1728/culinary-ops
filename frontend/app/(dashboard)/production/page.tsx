'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ProductionPlan } from '../../lib/api';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

export default function ProductionPlansPage() {
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getProductionPlans();
      setPlans(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this production plan?')) return;
    try {
      await api.deleteProductionPlan(id);
      load();
    } catch (e: any) { alert(e.message); }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">Weekly kitchen production schedules</p>
        </div>
        <Link
          href="/production/new"
          className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
        >
          + New Plan
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Week', 'Status', 'Meals', 'Portioned', 'Created', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
            ) : plans.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <p className="text-gray-400 mb-3">No production plans yet</p>
                  <Link href="/production/new" className="text-sm text-brand-600 hover:underline">Create your first plan →</Link>
                </td>
              </tr>
            ) : (
              plans.map((plan) => {
                const withQty = plan.items.filter((i) => i.quantity > 0).length;
                return (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/production/${plan.id}`} className="font-medium text-gray-900 hover:text-brand-600">
                        {plan.week_label}
                      </Link>
                      {plan.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{plan.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[plan.status] ?? STATUS_STYLES.draft}`}>
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{plan.items.length} meals</td>
                    <td className="px-4 py-3">
                      <span className={withQty > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                        {withQty} portioned
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(plan.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <Link href={`/production/${plan.id}`} className="text-xs text-brand-600 hover:underline">Open</Link>
                        <button onClick={() => handleDelete(plan.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

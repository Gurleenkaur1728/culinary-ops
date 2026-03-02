'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';
import { format } from 'date-fns';

interface ShoppingItem {
  ingredient_id: string;
  ingredient_name: string;
  sku: string;
  category: string;
  total_quantity: number;
  unit: string;
  supplier_name: string | null;
}

export default function ShoppingListPage() {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadList() {
    setLoading(true);
    try {
      const data = await api.getShoppingList(startDate, endDate);
      setItems(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  const groupedByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping List</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={loadList}
            disabled={loading}
            className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Generate List'}
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([category, categoryItems]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {category}
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categoryItems.map((item) => (
                      <tr key={item.ingredient_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.ingredient_name}</td>
                        <td className="px-4 py-3 text-gray-600">{item.sku}</td>
                        <td className="px-4 py-3 text-gray-600">{item.supplier_name || '—'}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {item.total_quantity} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

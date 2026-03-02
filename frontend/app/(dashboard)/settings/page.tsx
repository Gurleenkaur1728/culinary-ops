'use client';

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Application:</span>
              <span className="font-medium text-gray-900">Culinary Ops v1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Environment:</span>
              <span className="font-medium text-gray-900">Development</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">API Endpoint:</span>
              <span className="font-medium text-gray-900">http://localhost:3001/api</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
          <div className="space-y-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Change Password
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
          <div className="space-y-3">
            <button className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors">
              Recalculate All Costs
            </button>
            <p className="text-xs text-gray-500">
              Trigger a full recalculation of all sub-recipe and meal costs
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
          <div className="space-y-3">
            <button className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
              Export Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

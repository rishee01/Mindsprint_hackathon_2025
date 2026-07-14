/**
 * Admin Settings Page
 * Basic settings placeholder
 */

'use client';

import { useState } from 'react';
import { Cog6ToothIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage application settings</p>
      </div>

      {/* General Settings */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Cog6ToothIcon className="w-5 h-5 mr-2" />
          General Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="label">Application Name</label>
            <input
              type="text"
              defaultValue="CivicSense"
              className="input max-w-md"
            />
          </div>

          <div>
            <label className="label">Default City</label>
            <input
              type="text"
              defaultValue="New Delhi, India"
              className="input max-w-md"
            />
          </div>

          <div>
            <label className="label">Default Map Coordinates</label>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <input
                type="text"
                defaultValue="28.6139"
                placeholder="Latitude"
                className="input"
              />
              <input
                type="text"
                defaultValue="77.2090"
                placeholder="Longitude"
                className="input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>

        <div className="space-y-4">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="ml-2 text-sm text-gray-700">Email notifications for new issues</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="ml-2 text-sm text-gray-700">Email notifications for status changes</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="ml-2 text-sm text-gray-700">Daily digest email</span>
          </label>
        </div>
      </div>

      {/* Auto-Routing Settings */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Issue Routing Settings</h2>

        <div className="space-y-4">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="ml-2 text-sm text-gray-700">Enable automatic department assignment</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="ml-2 text-sm text-gray-700">Enable automatic severity scoring</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="ml-2 text-sm text-gray-700">Require community verification before routing</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            'Saving...'
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}

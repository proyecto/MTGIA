import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useSettings } from '../contexts/SettingsContext';

interface ProgressPayload {
  current: number;
  total: number;
  message: string;
}

export default function Settings() {
  const { currency, setCurrency } = useSettings();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ProgressPayload | null>(null);

  useEffect(() => {
    const unlisten = listen<ProgressPayload>('import-progress', (event) => {
      setProgress(event.payload);
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  async function handleImportSets() {
    setImporting(true);
    setProgress(null);
    try {
      await invoke('import_sets');
      alert('Sets imported successfully!');
    } catch (error) {
      console.error('Failed to import sets:', error);
      alert(`Error importing sets: ${error}`);
    } finally {
      setImporting(false);
      setProgress(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* General Settings */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <p className="text-xs text-gray-500">Select your preferred currency for prices.</p>
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'USD' | 'EUR')}
            className="rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring focus:ring-accent-blue focus:ring-opacity-50 p-2 border"
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>
      </section>

      {/* Database Management */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Database Management</h2>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Import/Update Sets</h3>
            <p className="text-xs text-gray-500 mt-1">Download the latest set data from Scryfall.</p>
          </div>
          <button
            onClick={handleImportSets}
            disabled={importing}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${importing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-accent-blue text-white hover:bg-blue-600'
              }`}
          >
            {importing ? 'Importing...' : 'Import Sets'}
          </button>
        </div>

        {importing && progress && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{progress.message}</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-accent-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

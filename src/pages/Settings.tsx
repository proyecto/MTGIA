import { useState, useEffect, useRef } from 'react';
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
  const [exportMessage, setExportMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unlisten = listen<ProgressPayload>('import-progress', (event) => {
      setProgress(event.payload);
    });

    return () => {
      unlisten.then(fn => fn());
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
      alert(`Failed to import sets: ${error}`);
    } finally {
      setImporting(false);
      setProgress(null);
    }
  }

  async function handleExportCollection() {
    setExportMessage('Exporting...');
    try {
      const csv = await invoke<string>('export_collection');

      // Create a blob and download it
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mtg-collection-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportMessage('✅ Collection exported successfully!');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (error) {
      console.error('Failed to export collection:', error);
      setExportMessage(`❌ Error: ${error}`);
    }
  }

  async function handleImportCollection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportMessage('Importing...');
    try {
      const text = await file.text();
      const result = await invoke<string>('import_collection', { csvContent: text });
      setImportMessage(`✅ ${result}`);
      setTimeout(() => setImportMessage(''), 5000);
    } catch (error) {
      console.error('Failed to import collection:', error);
      setImportMessage(`❌ Error: ${error}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

      {/* Export/Import Collection */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup & Restore</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Export Collection</h3>
            <p className="text-xs text-gray-500 mb-3">
              Download your collection as a CSV file for backup or use in other applications.
            </p>
            <button
              onClick={handleExportCollection}
              className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              📥 Export to CSV
            </button>
            {exportMessage && (
              <p className="text-sm mt-2 text-gray-700">{exportMessage}</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Import Collection</h3>
            <p className="text-xs text-gray-500 mb-3">
              Import cards from a CSV file. This will add cards to your existing collection.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCollection}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium cursor-pointer"
            >
              📤 Import from CSV
            </label>
            {importMessage && (
              <p className="text-sm mt-2 text-gray-700">{importMessage}</p>
            )}
          </div>
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

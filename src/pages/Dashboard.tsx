import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettings } from '../contexts/SettingsContext';
import PortfolioChart from '../components/PortfolioChart';

export default function Dashboard() {
    const { currency } = useSettings();
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState('');

    async function handleUpdatePrices() {
        setUpdating(true);
        setMessage('Updating prices from Scryfall...');
        try {
            const result = await invoke<string>('update_prices', { currencyPreference: currency });
            setMessage(result);
        } catch (error) {
            console.error('Failed to update prices:', error);
            setMessage(`Error: ${error}`);
        } finally {
            setUpdating(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Manage your collection and track investment value</p>
            </div>

            {/* Price Update Section */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Price Management</h2>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-gray-900">Update Collection Prices</h3>
                        <p className="text-xs text-gray-500 mt-1">Fetch latest prices from Scryfall for all cards in your collection.</p>
                        {message && (
                            <p className={`text-sm mt-2 ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                                {message}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleUpdatePrices}
                        disabled={updating}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${updating
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-accent-blue text-white hover:bg-blue-600'
                            }`}
                    >
                        {updating ? 'Updating...' : 'Update Prices'}
                    </button>
                </div>

                {updating && (
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-accent-blue h-2 rounded-full animate-pulse w-full" />
                        </div>
                    </div>
                )}
            </section>

            {/* Portfolio Value Chart */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Value Over Time</h2>
                <PortfolioChart />
            </section>
        </div>
    );
}

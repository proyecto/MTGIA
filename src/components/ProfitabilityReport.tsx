import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CollectionStats, CardPerformance } from '../types';
import { useSettings } from '../contexts/SettingsContext';

export default function ProfitabilityReport() {
    const { formatPrice } = useSettings();
    const [stats, setStats] = useState<CollectionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            setLoading(true);
            const data = await invoke<CollectionStats>('get_collection_stats');
            setStats(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch collection stats:', err);
            setError('Failed to load profitability report');
        } finally {
            setLoading(false);
        }
    }

    function exportToCSV() {
        if (!stats) return;

        const headers = ['Name', 'Set', 'Quantity', 'Purchase Price', 'Current Price', 'Total Gain', 'ROI %'];
        const rows = [...stats.top_winners, ...stats.top_losers].map(card => [
            `"${card.name.replace(/"/g, '""')}"`,
            card.set_code,
            card.quantity,
            card.purchase_price,
            card.current_price,
            card.total_gain,
            card.roi_percentage.toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `profitability_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-32 bg-gray-200 rounded-xl"></div>
                <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="bg-red-50 p-4 rounded-lg text-red-600">
                {error || 'No data available'}
            </div>
        );
    }

    const StatCard = ({ title, value, subValue, isPositive }: { title: string, value: string, subValue?: string, isPositive?: boolean }) => (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">{title}</h3>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {subValue && (
                <div className={`text-sm font-medium mt-1 ${isPositive === undefined ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {subValue}
                </div>
            )}
        </div>
    );

    const PerformanceTable = ({ title, cards }: { title: string, cards: CardPerformance[] }) => (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Card</th>
                            <th className="px-6 py-3 text-right">Bought</th>
                            <th className="px-6 py-3 text-right">Current</th>
                            <th className="px-6 py-3 text-right">Gain</th>
                            <th className="px-6 py-3 text-right">ROI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cards.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No data available</td>
                            </tr>
                        ) : (
                            cards.map((card) => (
                                <tr key={card.id} className="bg-white border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {card.name}
                                        <span className="ml-2 text-xs text-gray-500 uppercase">({card.set_code})</span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-500">{formatPrice(card.purchase_price)}</td>
                                    <td className="px-6 py-4 text-right text-gray-900">{formatPrice(card.current_price)}</td>
                                    <td className={`px-6 py-4 text-right font-medium ${card.total_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {card.total_gain >= 0 ? '+' : ''}{formatPrice(card.total_gain)}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-medium ${card.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {card.roi_percentage.toFixed(1)}%
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Profitability Report</h2>
                <button
                    onClick={exportToCSV}
                    className="text-sm font-medium text-accent-blue hover:text-blue-700 flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Investment"
                    value={formatPrice(stats.total_investment)}
                />
                <StatCard
                    title="Current Value"
                    value={formatPrice(stats.total_value)}
                />
                <StatCard
                    title="Total Gain/Loss"
                    value={(stats.total_gain >= 0 ? '+' : '') + formatPrice(stats.total_gain)}
                    isPositive={stats.total_gain >= 0}
                />
                <StatCard
                    title="Total ROI"
                    value={`${stats.total_roi_percentage.toFixed(2)}%`}
                    isPositive={stats.total_roi_percentage >= 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PerformanceTable title="Top Winners 🚀" cards={stats.top_winners} />
                <PerformanceTable title="Top Losers 📉" cards={stats.top_losers} />
            </div>
        </div>
    );
}

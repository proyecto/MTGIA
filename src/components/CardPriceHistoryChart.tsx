import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CardPriceHistoryPoint } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface CardPriceHistoryChartProps {
    cardId: string;
    purchasePrice?: number;
}

export default function CardPriceHistoryChart({ cardId, purchasePrice }: CardPriceHistoryChartProps) {
    const { formatPrice } = useSettings();
    const [history, setHistory] = useState<CardPriceHistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchHistory() {
            try {
                setLoading(true);
                const data = await invoke<CardPriceHistoryPoint[]>('get_card_price_history', { cardId });
                setHistory(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch price history:', err);
                setError('Failed to load price history');
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [cardId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <p>{error}</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="mt-2">No price history available yet</p>
                    <p className="text-sm text-gray-400 mt-1">Update prices to start tracking</p>
                </div>
            </div>
        );
    }

    // Calculate statistics
    const prices = history.map(h => h.price);
    const stats = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
        current: prices[prices.length - 1],
        change_percent: purchasePrice ? ((prices[prices.length - 1] - purchasePrice) / purchasePrice * 100) : 0
    };

    // Format data for chart
    const chartData = history.map(point => ({
        date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: point.price,
        fullDate: point.date
    }));

    return (
        <div className="space-y-4">
            {/* Statistics Cards */}
            <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="block text-xs text-gray-500 uppercase mb-1">Current</span>
                    <span className="text-lg font-bold text-gray-900">{formatPrice(stats.current)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="block text-xs text-gray-500 uppercase mb-1">Average</span>
                    <span className="text-lg font-bold text-gray-900">{formatPrice(stats.average)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="block text-xs text-gray-500 uppercase mb-1">Min</span>
                    <span className="text-lg font-bold text-gray-900">{formatPrice(stats.min)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="block text-xs text-gray-500 uppercase mb-1">Max</span>
                    <span className="text-lg font-bold text-gray-900">{formatPrice(stats.max)}</span>
                </div>
            </div>

            {purchasePrice && (
                <div className={`p-3 rounded-lg ${stats.change_percent >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Change since purchase</span>
                        <span className={`text-lg font-bold ${stats.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.change_percent >= 0 ? '+' : ''}{stats.change_percent.toFixed(2)}%
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Purchase price: {formatPrice(purchasePrice)} → Current: {formatPrice(stats.current)}
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Price History</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            stroke="#9ca3af"
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            stroke="#9ca3af"
                            tickFormatter={(value) => `$${value.toFixed(2)}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            formatter={(value: number) => [formatPrice(value), 'Price']}
                            labelFormatter={(label, payload) => {
                                if (payload && payload[0]) {
                                    return new Date(payload[0].payload.fullDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    });
                                }
                                return label;
                            }}
                        />
                        <Legend />
                        {purchasePrice && (
                            <ReferenceLine
                                y={purchasePrice}
                                stroke="#9ca3af"
                                strokeDasharray="3 3"
                                label={{ value: 'Purchase', position: 'right', fontSize: 11, fill: '#6b7280' }}
                            />
                        )}
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 3 }}
                            activeDot={{ r: 5 }}
                            name="Market Price"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

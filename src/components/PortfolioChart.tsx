import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSettings } from '../contexts/SettingsContext';

interface PortfolioDataPoint {
    date: string;
    total_value: number;
    total_investment: number;
}

export default function PortfolioChart() {
    const [data, setData] = useState<PortfolioDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatPrice } = useSettings();

    useEffect(() => {
        loadPortfolioHistory();
    }, []);

    async function loadPortfolioHistory() {
        try {
            const history = await invoke<PortfolioDataPoint[]>('get_portfolio_history');
            setData(history);
        } catch (error) {
            console.error('Failed to load portfolio history:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">Loading chart...</div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                <p className="mb-2">📈</p>
                <p>No price history available yet.</p>
                <p className="text-xs mt-2">Update prices from the Dashboard to start tracking your portfolio value.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => formatPrice(value)}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px'
                        }}
                        formatter={(value: number) => formatPrice(value)}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                    />
                    <Line
                        type="monotone"
                        dataKey="total_value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Current Value"
                    />
                    <Line
                        type="monotone"
                        dataKey="total_investment"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Total Investment"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

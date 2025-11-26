import { useMemo } from 'react';
import { CollectionCard } from '../types';
import { useSettings } from '../contexts/SettingsContext';

/**
 * Props for the StatisticsModal component.
 */
interface StatisticsModalProps {
    /** Whether the modal is currently visible */
    isOpen: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** The list of cards to calculate statistics from */
    cards: CollectionCard[];
}

/**
 * Modal that displays detailed statistics about the collection.
 * Includes total value, card counts, most valuable cards, and set distribution.
 */
export default function StatisticsModal({ isOpen, onClose, cards }: StatisticsModalProps) {
    const { formatPrice } = useSettings();

    const stats = useMemo(() => {
        if (cards.length === 0) return null;

        const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
        const totalValue = cards.reduce((sum, card) => sum + (card.current_price * card.quantity), 0);
        const uniqueCards = cards.length;

        // Most valuable cards
        const sortedByPrice = [...cards].sort((a, b) => b.current_price - a.current_price);
        const topCards = sortedByPrice.slice(0, 5);

        // Set distribution
        const setCounts: Record<string, number> = {};
        cards.forEach(card => {
            setCounts[card.set_code] = (setCounts[card.set_code] || 0) + card.quantity;
        });
        const topSets = Object.entries(setCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        return {
            totalCards,
            totalValue,
            uniqueCards,
            topCards,
            topSets
        };
    }, [cards]);

    if (!isOpen || !stats) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">Collection Statistics</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8">
                    {/* Summary Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <div className="text-sm text-blue-600 font-medium uppercase tracking-wider mb-1">Total Value</div>
                            <div className="text-2xl font-bold text-blue-900">{formatPrice(stats.totalValue)}</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <div className="text-sm text-purple-600 font-medium uppercase tracking-wider mb-1">Total Cards</div>
                            <div className="text-2xl font-bold text-purple-900">{stats.totalCards}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <div className="text-sm text-green-600 font-medium uppercase tracking-wider mb-1">Unique</div>
                            <div className="text-2xl font-bold text-green-900">{stats.uniqueCards}</div>
                        </div>
                    </div>

                    {/* Top Cards */}
                    <div>
                        <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span>💎</span> Most Valuable Cards
                        </h3>
                        <div className="space-y-2">
                            {stats.topCards.map(card => (
                                <div key={card.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden">
                                            {card.image_uri && <img src={card.image_uri} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{card.name}</div>
                                            <div className="text-xs text-gray-500">{card.set_code.toUpperCase()} • {card.condition} {card.is_foil && '• Foil'}</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-gray-900">{formatPrice(card.current_price)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Sets */}
                    <div>
                        <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span>📦</span> Top Sets by Count
                        </h3>
                        <div className="space-y-2">
                            {stats.topSets.map(([set, count], index) => (
                                <div key={set} className="flex items-center gap-3">
                                    <div className="w-8 text-center text-gray-400 font-mono text-sm">#{index + 1}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700 uppercase">{set}</span>
                                            <span className="text-gray-500">{count} cards</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-accent-blue h-2 rounded-full"
                                                style={{ width: `${(count / stats.totalCards) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ScryfallCard } from '../types';
import CardItem from '../components/CardItem';
import CardDetailsModal from '../components/CardDetailsModal';
import { useSettings } from '../contexts/SettingsContext';

interface MarketTrendsData {
    standard_staples: ScryfallCard[];
    modern_staples: ScryfallCard[];
    commander_popularity: ScryfallCard[];
    new_hot: ScryfallCard[];
}

export default function MarketTrends() {
    const { currency } = useSettings();
    const [trends, setTrends] = useState<MarketTrendsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);

    useEffect(() => {
        fetchTrends();
    }, []);

    async function fetchTrends() {
        try {
            setLoading(true);
            const data = await invoke<MarketTrendsData>('get_market_trends');
            setTrends(data);
        } catch (err) {
            console.error('Failed to fetch market trends:', err);
            setError('Failed to load market trends. Please try again later.');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="text-red-500 text-xl mb-2">⚠️</div>
                <p className="text-gray-600">{error}</p>
                <button
                    onClick={fetchTrends}
                    className="mt-4 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!trends) return null;

    const Section = ({ title, cards }: { title: string, cards: ScryfallCard[] }) => (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                {title}
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {cards.length}
                </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {cards.map(card => (
                    <CardItem
                        key={card.id}
                        // Adapt ScryfallCard to CollectionCard interface for display
                        name={card.name}
                        image_uri={card.image_uris?.normal || card.image_uris?.small || ''}
                        set_code={card.set}
                        condition="NM" // Default for display
                        current_price={parseFloat(currency === 'EUR' ? (card.prices.eur || '0') : (card.prices.usd || '0'))}
                        quantity={0} // Not in collection
                        is_foil={false}
                        language="English"
                        id={card.id}
                        scryfall_id={card.id}
                        purchase_price={0}
                        finish="nonfoil"
                        collector_number={card.collector_number}

                        onClick={() => setSelectedCard(card)}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Global Market Trends</h1>
                <p className="text-gray-500 mt-2">
                    Top performing and popular cards across major formats.
                </p>
            </header>

            <div className="space-y-8">
                <Section title="Standard Staples (Top Value)" cards={trends.standard_staples} />
                <Section title="Modern Staples (Top Value)" cards={trends.modern_staples} />
                <Section title="Commander Popularity (Most Played)" cards={trends.commander_popularity} />
                <Section title="New & Hot (Last 30 Days)" cards={trends.new_hot} />
            </div>

            {selectedCard && (
                <CardDetailsModal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                    mode="add"
                    onCardAdded={() => {
                        // Optional: Show success message or just close
                        setSelectedCard(null);
                    }}
                />
            )}
        </div>
    );
}

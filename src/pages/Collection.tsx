import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import CardGrid from '../components/CardGrid';
import CardItem from '../components/CardItem';
import { CollectionCard } from '../types';
import { useSettings } from '../contexts/SettingsContext';

export default function Collection() {
    const [cards, setCards] = useState<CollectionCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCollection();
    }, []);

    async function loadCollection() {
        try {
            const result = await invoke<CollectionCard[]>('get_collection');
            setCards(result);
        } catch (error) {
            console.error('Failed to load collection:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-full text-gray-400">Loading collection...</div>;
    }

    // Moved these declarations outside the conditional loading block
    const totalValue = cards.reduce((sum, card) => sum + (card.current_price * card.quantity), 0);
    const { formatPrice } = useSettings();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Collection</h1>
                    <p className="text-gray-500 mt-1">{cards.reduce((sum, card) => sum + card.quantity, 0)} cards collected</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Total Value</p>
                    <p className="text-2xl font-bold text-accent-blue">{formatPrice(totalValue)}</p>
                </div>
            </div>

            {cards.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="mb-4">Your collection is empty.</p>
                    <button className="btn-primary">Add your first card</button>
                </div>
            ) : (
                <CardGrid>
                    {cards.map((card) => (
                        <CardItem key={card.id} {...card} />
                    ))}
                </CardGrid>
            )}
        </div>
    );
}

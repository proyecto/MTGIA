import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ScryfallCard } from '../types';
import CardDetailsModal from '../components/CardDetailsModal';

interface SetCardsProps {
    setCode: string;
    setName: string;
    onBack: () => void;
}

export default function SetCards({ setCode, setName, onBack }: SetCardsProps) {
    const [cards, setCards] = useState<ScryfallCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);

    useEffect(() => {
        loadCards();
    }, [setCode]);

    async function loadCards() {
        setLoading(true);
        setError(null);
        try {
            const result = await invoke<ScryfallCard[]>('get_set_cards', { setCode });
            setCards(result);
        } catch (err) {
            console.error('Failed to load cards:', err);
            setError(typeof err === 'string' ? err : JSON.stringify(err));
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border-color bg-white">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to All Sets
                    </button>
                    <h1 className="text-2xl font-bold text-text-primary">{setName}</h1>
                    <p className="text-sm text-text-secondary mt-1 uppercase font-mono">{setCode}</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto mb-4"></div>
                        <p className="text-text-secondary">Loading cards...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border-color bg-white">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to All Sets
                    </button>
                    <h1 className="text-2xl font-bold text-text-primary">{setName}</h1>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">Error: {error}</p>
                        <button onClick={loadCards} className="btn-primary">
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-border-color bg-white">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to All Sets
                </button>
                <h1 className="text-2xl font-bold text-text-primary">{setName}</h1>
                <p className="text-sm text-text-secondary mt-1">
                    <span className="uppercase font-mono bg-gray-100 px-2 py-0.5 rounded">{setCode}</span>
                    <span className="ml-3">{cards.length} {cards.length === 1 ? 'card' : 'cards'}</span>
                </p>
            </div>

            {/* Cards Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {cards.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-text-secondary">No cards found in this set.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                className="group cursor-pointer"
                                title={card.name}
                                onClick={() => setSelectedCard(card)}
                            >
                                <div className="relative aspect-[5/7] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:scale-105">
                                    {card.image_uris?.normal ? (
                                        <img
                                            src={card.image_uris.normal}
                                            alt={card.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <div className="text-center p-4">
                                                <p className="text-xs text-gray-500 font-semibold">{card.name}</p>
                                                <p className="text-xs text-gray-400 mt-1">No Image</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rarity indicator */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className={`w-3 h-3 rounded-full ${card.rarity === 'mythic' ? 'bg-orange-500' :
                                            card.rarity === 'rare' ? 'bg-yellow-500' :
                                                card.rarity === 'uncommon' ? 'bg-gray-400' :
                                                    'bg-gray-600'
                                            }`} title={card.rarity}></div>
                                    </div>
                                </div>

                                {/* Card name below image */}
                                <p className="text-xs text-center mt-2 text-text-primary truncate px-1">
                                    {card.name}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Card Details Modal */}
            {selectedCard && (
                <CardDetailsModal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                />
            )}
        </div>
    );
}

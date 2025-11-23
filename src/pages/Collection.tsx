import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import CardGrid from '../components/CardGrid';
import CardItem from '../components/CardItem';
import StatisticsModal from '../components/StatisticsModal';
import EditCardModal from '../components/EditCardModal';
import { CollectionCard } from '../types';
import { useSettings } from '../contexts/SettingsContext';

export default function Collection() {
    const [cards, setCards] = useState<CollectionCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState<'name' | 'price-desc' | 'price-asc' | 'quantity'>('name');
    const [selectedSet, setSelectedSet] = useState<string>('all');
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [cardToEdit, setCardToEdit] = useState<CollectionCard | null>(null);

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

    async function handleDeleteCard(id: string) {
        if (!confirm('Are you sure you want to delete this card?')) return;

        try {
            await invoke('remove_card', { id });
            loadCollection();
        } catch (error) {
            console.error("Failed to delete card:", error);
            alert(`Failed to delete card: ${error} `);
        }
    }

    function handleEditCard(card: CollectionCard) {
        setCardToEdit(card);
        setIsEditOpen(true);
    }

    if (loading) {
        return <div className="flex items-center justify-center h-full text-gray-400">Loading collection...</div>;
    }

    // Filter and Sort Logic
    const filteredCards = cards.filter(card => {
        const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSet = selectedSet === 'all' || card.set_code === selectedSet;
        return matchesSearch && matchesSet;
    });

    const sortedCards = [...filteredCards].sort((a, b) => {
        switch (sortOption) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'price-desc':
                return b.current_price - a.current_price;
            case 'price-asc':
                return a.current_price - b.current_price;
            case 'quantity':
                return b.quantity - a.quantity;
            default:
                return 0;
        }
    });

    // Get unique sets for filter
    const uniqueSets = Array.from(new Set(cards.map(c => c.set_code))).sort();

    // Moved these declarations outside the conditional loading block
    const totalValue = cards.reduce((sum, card) => sum + (card.current_price * card.quantity), 0);
    const { formatPrice } = useSettings();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Collection</h1>
                    <p className="text-gray-500 mt-1">{cards.reduce((sum, card) => sum + card.quantity, 0)} cards collected</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsStatsOpen(true)}
                        className="text-sm font-medium text-accent-blue hover:text-blue-700 flex items-center gap-1"
                    >
                        <span className="text-lg">📊</span> View Stats
                    </button>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Total Value</p>
                        <p className="text-2xl font-bold text-accent-blue">{formatPrice(totalValue)}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <input
                        type="text"
                        placeholder="Filter by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent outline-none"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <select
                    value={selectedSet}
                    onChange={(e) => setSelectedSet(e.target.value)}
                    className="w-full md:w-48 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent-blue outline-none"
                >
                    <option value="all">All Sets</option>
                    {uniqueSets.map(set => (
                        <option key={set} value={set}>{set.toUpperCase()}</option>
                    ))}
                </select>

                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="w-full md:w-48 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent-blue outline-none"
                >
                    <option value="name">Name (A-Z)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="quantity">Quantity</option>
                </select>
            </div>

            {cards.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="mb-4">Your collection is empty.</p>
                </div>
            ) : (
                <CardGrid>
                    {sortedCards.map((card) => (
                        <CardItem
                            key={card.id}
                            {...card}
                            onEdit={() => handleEditCard(card)}
                            onDelete={() => handleDeleteCard(card.id)}
                        />
                    ))}
                </CardGrid>
            )}

            <StatisticsModal
                isOpen={isStatsOpen}
                onClose={() => setIsStatsOpen(false)}
                cards={cards}
            />

            <EditCardModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onCardUpdated={loadCollection}
                card={cardToEdit}
            />
        </div>
    );
}

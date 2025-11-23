import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { WishlistCard, ScryfallCard } from '../types';


export default function Wishlist() {
    const [wishlist, setWishlist] = useState<WishlistCard[]>([]);
    const [filteredWishlist, setFilteredWishlist] = useState<WishlistCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<number | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCard, setEditingCard] = useState<WishlistCard | null>(null);

    useEffect(() => {
        loadWishlist();
    }, []);

    useEffect(() => {
        let filtered = wishlist;

        // Filter by search query
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(card =>
                card.name.toLowerCase().includes(query) ||
                card.set_code.toLowerCase().includes(query)
            );
        }

        // Filter by priority
        if (priorityFilter !== null) {
            filtered = filtered.filter(card => card.priority === priorityFilter);
        }

        setFilteredWishlist(filtered);
    }, [searchQuery, priorityFilter, wishlist]);

    async function loadWishlist() {
        setLoading(true);
        try {
            const result = await invoke<WishlistCard[]>('get_wishlist');
            setWishlist(result);
            setFilteredWishlist(result);
        } catch (err) {
            console.error('Failed to load wishlist:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddCard(card: ScryfallCard) {
        try {
            await invoke('add_to_wishlist', {
                card,
                targetPrice: null,
                notes: null,
                priority: 1
            });
            await loadWishlist();
            setShowAddModal(false);
        } catch (err) {
            console.error('Failed to add to wishlist:', err);
            alert(`Failed to add card: ${err}`);
        }
    }

    async function handleRemove(id: string) {
        if (!confirm('Are you sure you want to remove this card from your wishlist?')) return;

        try {
            await invoke('remove_from_wishlist', { id });
            await loadWishlist();
        } catch (err) {
            console.error('Failed to remove from wishlist:', err);
            alert(`Failed to remove card: ${err}`);
        }
    }

    async function handleUpdate(id: string, targetPrice: number | null, notes: string | null, priority: number) {
        try {
            await invoke('update_wishlist_card', {
                id,
                targetPrice,
                notes,
                priority
            });
            await loadWishlist();
            setEditingCard(null);
        } catch (err) {
            console.error('Failed to update wishlist card:', err);
            alert(`Failed to update card: ${err}`);
        }
    }

    const getPriorityLabel = (priority: number) => {
        switch (priority) {
            case 3: return 'High';
            case 2: return 'Medium';
            case 1: return 'Low';
            default: return 'Low';
        }
    };

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 3: return 'bg-red-100 text-red-800';
            case 2: return 'bg-yellow-100 text-yellow-800';
            case 1: return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading wishlist...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-border-color bg-white">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Wishlist</h1>
                        <p className="text-sm text-text-secondary mt-1">
                            {filteredWishlist.length} {filteredWishlist.length === 1 ? 'card' : 'cards'}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary"
                    >
                        + Add Card
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by card name or set..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent outline-none"
                        />
                    </div>
                    <select
                        value={priorityFilter ?? ''}
                        onChange={(e) => setPriorityFilter(e.target.value ? parseInt(e.target.value) : null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent outline-none"
                    >
                        <option value="">All Priorities</option>
                        <option value="3">High Priority</option>
                        <option value="2">Medium Priority</option>
                        <option value="1">Low Priority</option>
                    </select>
                </div>
            </div>

            {/* Wishlist Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {filteredWishlist.length === 0 ? (
                    <div className="text-center py-12">
                        {wishlist.length === 0 ? (
                            <div>
                                <div className="text-6xl mb-4">⭐️</div>
                                <h2 className="text-xl font-bold text-text-primary mb-2">Your wishlist is empty</h2>
                                <p className="text-text-secondary mb-6">
                                    Add cards you want to acquire to keep track of them.
                                </p>
                                <button onClick={() => setShowAddModal(true)} className="btn-primary">
                                    Add Your First Card
                                </button>
                            </div>
                        ) : (
                            <p className="text-text-secondary">No cards match your filters.</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredWishlist.map((card) => (
                            <div
                                key={card.id}
                                className="bg-white border border-border-color rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Card Image */}
                                <div className="aspect-[5/7] bg-gray-100">
                                    {card.image_uri ? (
                                        <img
                                            src={card.image_uri}
                                            alt={card.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                </div>

                                {/* Card Info */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-text-primary mb-1 truncate">{card.name}</h3>
                                    <p className="text-xs text-text-secondary mb-2">
                                        <span className="uppercase font-mono bg-gray-100 px-1 rounded">{card.set_code}</span>
                                        <span className="ml-2">#{card.collector_number}</span>
                                    </p>

                                    {/* Priority Badge */}
                                    <div className="mb-2">
                                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(card.priority)}`}>
                                            {getPriorityLabel(card.priority)} Priority
                                        </span>
                                    </div>

                                    {/* Target Price */}
                                    {card.target_price && (
                                        <p className="text-sm text-text-secondary mb-2">
                                            Target: ${card.target_price.toFixed(2)}
                                        </p>
                                    )}

                                    {/* Notes */}
                                    {card.notes && (
                                        <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                                            {card.notes}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => setEditingCard(card)}
                                            className="flex-1 text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleRemove(card.id)}
                                            className="flex-1 text-xs px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Card Modal */}
            {showAddModal && (
                <AddCardToWishlistModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onCardAdded={handleAddCard}
                />
            )}

            {/* Edit Card Modal */}
            {editingCard && (
                <EditWishlistModal
                    card={editingCard}
                    onClose={() => setEditingCard(null)}
                    onSave={handleUpdate}
                />
            )}
        </div>
    );
}

// Add Card to Wishlist Modal Component
interface AddCardToWishlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCardAdded: (card: ScryfallCard) => void;
}

function AddCardToWishlistModal({ isOpen, onClose, onCardAdded }: AddCardToWishlistModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ScryfallCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length > 2) {
                setLoading(true);
                try {
                    const cards = await invoke<ScryfallCard[]>('search_scryfall', { query });
                    setResults(cards);
                } catch (error) {
                    console.error("Search failed:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    function handleAddCard() {
        if (!selectedCard) return;
        onCardAdded(selectedCard);
        handleClose();
    }

    function handleClose() {
        setQuery('');
        setResults([]);
        setSelectedCard(null);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">Add Card to Wishlist</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Search & Results */}
                    <div className={`flex-1 flex flex-col border-r border-gray-100 ${selectedCard ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4">
                            <input
                                type="text"
                                placeholder="Search card name..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent outline-none"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {loading && <div className="text-center text-gray-500 py-4">Searching...</div>}
                            {results.map((card) => (
                                <div
                                    key={card.id}
                                    onClick={() => setSelectedCard(card)}
                                    className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${selectedCard?.id === card.id ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-gray-50 border border-transparent'}`}
                                >
                                    {card.image_uris?.small && (
                                        <img src={card.image_uris.small} alt={card.name} className="w-12 h-16 object-cover rounded shadow-sm mr-3" />
                                    )}
                                    <div>
                                        <div className="font-medium text-gray-900">{card.name}</div>
                                        <div className="text-xs text-gray-500">
                                            <span className="uppercase font-mono bg-gray-100 px-1 rounded">{card.set}</span>
                                            <span className="ml-2">{card.set_name}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Selected Card */}
                    {selectedCard && (
                        <div className="w-full md:w-80 bg-gray-50 p-6 flex flex-col">
                            <div className="mb-6 flex justify-center">
                                {selectedCard.image_uris?.normal ? (
                                    <img src={selectedCard.image_uris.normal} alt={selectedCard.name} className="rounded-lg shadow-md max-w-[200px]" />
                                ) : (
                                    <div className="w-[200px] h-[280px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">No Image</div>
                                )}
                            </div>

                            <h3 className="font-bold text-lg text-gray-900 mb-1">{selectedCard.name}</h3>
                            <p className="text-sm text-gray-500 mb-6">{selectedCard.set.toUpperCase()} • {selectedCard.rarity}</p>

                            <button
                                onClick={handleAddCard}
                                className="w-full btn-primary"
                            >
                                Add to Wishlist
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


// Edit Wishlist Modal Component
interface EditWishlistModalProps {
    card: WishlistCard;
    onClose: () => void;
    onSave: (id: string, targetPrice: number | null, notes: string | null, priority: number) => void;
}

function EditWishlistModal({ card, onClose, onSave }: EditWishlistModalProps) {
    const [targetPrice, setTargetPrice] = useState(card.target_price?.toString() ?? '');
    const [notes, setNotes] = useState(card.notes ?? '');
    const [priority, setPriority] = useState(card.priority);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const price = targetPrice.trim() ? parseFloat(targetPrice) : null;
        const noteText = notes.trim() || null;
        onSave(card.id, price, noteText, priority);
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Edit Wishlist Card</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <p className="font-semibold text-gray-900 mb-1">{card.name}</p>
                        <p className="text-sm text-gray-500">{card.set_code.toUpperCase()} #{card.collector_number}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                            placeholder="Optional"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent outline-none"
                        >
                            <option value={1}>Low Priority</option>
                            <option value={2}>Medium Priority</option>
                            <option value={3}>High Priority</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional notes..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent outline-none resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 btn-primary"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

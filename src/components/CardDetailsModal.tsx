import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ScryfallCard, AddCardArgs, CollectionCard } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface CardDetailsModalProps {
    card: ScryfallCard;
    onClose: () => void;
    onCardAdded?: () => void;
    mode?: 'add' | 'view';
    collectionCard?: CollectionCard;
}

export default function CardDetailsModal({ card, onClose, onCardAdded, mode = 'add', collectionCard }: CardDetailsModalProps) {
    const { currency, formatPrice } = useSettings();
    const [activeTab, setActiveTab] = useState<'collection' | 'wishlist'>('collection');
    const [loading, setLoading] = useState(false);

    // Collection Form State
    const [quantity, setQuantity] = useState(1);
    const [condition, setCondition] = useState('NM');
    const [isFoil, setIsFoil] = useState(false);
    const [price, setPrice] = useState(0);

    // Wishlist Form State
    const [targetPrice, setTargetPrice] = useState('');
    const [priority, setPriority] = useState(1);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // Auto-fill price based on selection and currency
        let priceStr;
        if (currency === 'EUR') {
            priceStr = isFoil ? card.prices.eur_foil : card.prices.eur;
        } else {
            priceStr = isFoil ? card.prices.usd_foil : card.prices.usd;
        }
        setPrice(priceStr ? parseFloat(priceStr) : 0);
    }, [card, isFoil, currency]);

    async function handleAddToCollection() {
        setLoading(true);
        const args: AddCardArgs = {
            scryfall_id: card.id,
            condition,
            purchase_price: price,
            quantity,
            is_foil: isFoil,
        };

        try {
            await invoke('add_card', { args, currencyPreference: currency });
            if (onCardAdded) onCardAdded();
            onClose();
            alert('Card added to collection!');
        } catch (error) {
            console.error("Failed to add card:", error);
            alert(`Failed to add card: ${error}`);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddToWishlist() {
        setLoading(true);
        try {
            await invoke('add_to_wishlist', {
                card,
                targetPrice: targetPrice ? parseFloat(targetPrice) : null,
                notes: notes.trim() || null,
                priority
            });
            if (onCardAdded) onCardAdded();
            onClose();
            alert('Card added to wishlist!');
        } catch (error) {
            console.error("Failed to add to wishlist:", error);
            alert(`Failed to add card: ${error}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex overflow-hidden">
                {/* Left: Card Image & Info */}
                <div className="w-1/3 bg-gray-50 p-6 border-r border-gray-100 flex flex-col overflow-y-auto">
                    <div className="mb-6 flex justify-center">
                        {card.image_uris?.normal ? (
                            <img src={card.image_uris.normal} alt={card.name} className="rounded-lg shadow-lg w-full max-w-[280px]" />
                        ) : (
                            <div className="w-full aspect-[5/7] bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">No Image</div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{card.name}</h2>
                            <p className="text-sm text-gray-500">{card.type_line}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-xs text-gray-500 uppercase">Set</span>
                                <span className="font-medium">{card.set_name}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500 uppercase">Rarity</span>
                                <span className="font-medium capitalize">{card.rarity}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500 uppercase">Collector #</span>
                                <span className="font-medium">{card.collector_number}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500 uppercase">Artist</span>
                                <span className="font-medium truncate" title={card.artist}>{card.artist}</span>
                            </div>
                        </div>

                        {card.oracle_text && (
                            <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
                                {card.oracle_text}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="w-2/3 flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        {mode === 'add' ? (
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setActiveTab('collection')}
                                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'collection'
                                        ? 'border-accent-blue text-accent-blue'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Add to Collection
                                </button>
                                <button
                                    onClick={() => setActiveTab('wishlist')}
                                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'wishlist'
                                        ? 'border-accent-blue text-accent-blue'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Add to Wishlist
                                </button>
                            </div>
                        ) : (
                            <h3 className="text-lg font-medium text-gray-900">Card Details</h3>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                        {mode === 'view' && collectionCard ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <span className="block text-xs text-gray-500 uppercase mb-1">Quantity</span>
                                        <span className="text-2xl font-bold text-gray-900">{collectionCard.quantity}</span>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <span className="block text-xs text-gray-500 uppercase mb-1">Condition</span>
                                        <span className="text-2xl font-bold text-gray-900">{collectionCard.condition}</span>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <span className="block text-xs text-gray-500 uppercase mb-1">Purchase Price</span>
                                        <span className="text-2xl font-bold text-gray-900">{formatPrice(collectionCard.purchase_price)}</span>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <span className="block text-xs text-gray-500 uppercase mb-1">Current Value</span>
                                        <span className="text-2xl font-bold text-accent-blue">{formatPrice(collectionCard.current_price)}</span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-4">Market Prices</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                                            <span className="text-sm text-gray-600">USD</span>
                                            <span className="font-medium">{card.prices.usd ? `$${card.prices.usd}` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                                            <span className="text-sm text-gray-600">USD Foil</span>
                                            <span className="font-medium">{card.prices.usd_foil ? `$${card.prices.usd_foil}` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                                            <span className="text-sm text-gray-600">EUR</span>
                                            <span className="font-medium">{card.prices.eur ? `€${card.prices.eur}` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                                            <span className="text-sm text-gray-600">EUR Foil</span>
                                            <span className="font-medium">{card.prices.eur_foil ? `€${card.prices.eur_foil}` : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'collection' ? (
                            <div className="space-y-6 max-w-md">
                                <div>
                                    <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                                    <select
                                        id="condition"
                                        value={condition}
                                        onChange={(e) => setCondition(e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring focus:ring-accent-blue focus:ring-opacity-50 p-2 border"
                                    >
                                        <option value="NM">Near Mint (NM)</option>
                                        <option value="LP">Lightly Played (LP)</option>
                                        <option value="MP">Moderately Played (MP)</option>
                                        <option value="HP">Heavily Played (HP)</option>
                                        <option value="DMG">Damaged (DMG)</option>
                                    </select>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                        <input
                                            id="quantity"
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value))}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring focus:ring-accent-blue focus:ring-opacity-50 p-2 border"
                                        />
                                    </div>
                                    <div className="flex items-end pb-2">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isFoil}
                                                onChange={(e) => setIsFoil(e.target.checked)}
                                                className="rounded text-accent-blue focus:ring-accent-blue"
                                            />
                                            <span className="text-sm text-gray-700">Foil</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="purchase-price" className="block text-sm font-medium text-gray-700 mb-1">Purchase Price ({currency === 'EUR' ? '€' : '$'})</label>
                                    <input
                                        id="purchase-price"
                                        type="number"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(parseFloat(e.target.value))}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring focus:ring-accent-blue focus:ring-opacity-50 p-2 border"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Market Price: {currency === 'EUR'
                                            ? (isFoil ? card.prices.eur_foil : card.prices.eur) || 'N/A'
                                            : (isFoil ? card.prices.usd_foil : card.prices.usd) || 'N/A'}
                                    </p>
                                </div>

                                <button
                                    data-testid="submit-collection"
                                    onClick={handleAddToCollection}
                                    disabled={loading}
                                    className="w-full btn-primary py-3 flex justify-center items-center gap-2"
                                >
                                    {loading ? 'Adding...' : 'Add to Collection'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-md">
                                <div>
                                    <label htmlFor="target-price" className="block text-sm font-medium text-gray-700 mb-1">Target Price ({currency === 'EUR' ? '€' : '$'})</label>
                                    <input
                                        id="target-price"
                                        type="number"
                                        step="0.01"
                                        value={targetPrice}
                                        onChange={(e) => setTargetPrice(e.target.value)}
                                        placeholder="Optional"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring focus:ring-accent-blue focus:ring-opacity-50 p-2 border"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        id="priority"
                                        value={priority}
                                        onChange={(e) => setPriority(parseInt(e.target.value))}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring focus:ring-accent-blue focus:ring-opacity-50 p-2 border"
                                    >
                                        <option value={1}>Low Priority</option>
                                        <option value={2}>Medium Priority</option>
                                        <option value={3}>High Priority</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Optional notes..."
                                        rows={4}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring focus:ring-accent-blue focus:ring-opacity-50 p-2 border resize-none"
                                    />
                                </div>

                                <button
                                    data-testid="submit-wishlist"
                                    onClick={handleAddToWishlist}
                                    disabled={loading}
                                    className="w-full btn-primary py-3 flex justify-center items-center gap-2"
                                >
                                    {loading ? 'Adding...' : 'Add to Wishlist'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

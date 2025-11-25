import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ScryfallCard, AddCardArgs } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCardAdded: () => void;
}

export default function SearchModal({ isOpen, onClose, onCardAdded }: SearchModalProps) {
    const { currency } = useSettings();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ScryfallCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);

    // Form state
    const [quantity, setQuantity] = useState(1);
    const [condition, setCondition] = useState('NM');
    const [language, setLanguage] = useState('English');
    const [isFoil, setIsFoil] = useState(false);
    const [price, setPrice] = useState(0);

    useEffect(() => {
        if (selectedCard) {
            // Auto-fill price based on selection and currency
            let priceStr;
            if (currency === 'EUR') {
                priceStr = isFoil ? selectedCard.prices.eur_foil : selectedCard.prices.eur;
            } else {
                priceStr = isFoil ? selectedCard.prices.usd_foil : selectedCard.prices.usd;
            }
            setPrice(priceStr ? parseFloat(priceStr) : 0);
        }
    }, [selectedCard, isFoil, currency]);

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

    async function handleAddCard() {
        if (!selectedCard) return;

        const args: AddCardArgs = {
            scryfall_id: selectedCard.id,
            condition,
            purchase_price: price,
            quantity,
            is_foil: isFoil,
            language,
        };

        try {
            // We are passing the price directly, but the backend currently recalculates current_price from USD.
            // We should probably pass the currency preference to the backend too, or just let the backend store the purchase price as is.
            // For now, let's update the backend to respect the currency for current_price.
            await invoke('add_card', { args, currencyPreference: currency });
            onCardAdded();
            handleClose();
        } catch (error) {
            console.error("Failed to add card:", error);
            alert(`Failed to add card: ${error} `);
        }
    }

    function handleClose() {
        setQuery('');
        setResults([]);
        setSelectedCard(null);
        setQuantity(1);
        setCondition('NM');
        setLanguage('English');
        setIsFoil(false);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">Add Card</h2>
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
                                    className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${selectedCard?.id === card.id ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                >
                                    {card.image_uris?.small && (
                                        <img src={card.image_uris.small} alt={card.name} className="w-12 h-16 object-cover rounded shadow-sm mr-3" />
                                    )}
                                    <div>
                                        <div>
                                            <div className="font-medium text-gray-900">{card.name}</div>
                                            <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="uppercase font-mono bg-gray-100 px-1 rounded" title={card.set_name}>{card.set}</span>
                                                    <span className="truncate max-w-[150px]">{card.set_name}</span>
                                                    <span>({card.released_at?.substring(0, 4)})</span>
                                                </div>
                                                <div className="text-gray-400">
                                                    #{card.collector_number} • {card.artist}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Details Form */}
                    {selectedCard && (
                        <div className="w-full md:w-80 bg-gray-50 p-6 flex flex-col overflow-y-auto">
                            <div className="mb-6 flex justify-center">
                                {selectedCard.image_uris?.normal ? (
                                    <img src={selectedCard.image_uris.normal} alt={selectedCard.name} className="rounded-lg shadow-md max-w-[200px]" />
                                ) : (
                                    <div className="w-[200px] h-[280px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">No Image</div>
                                )}
                            </div>

                            <h3 className="font-bold text-lg text-gray-900 mb-1">{selectedCard.name}</h3>
                            <p className="text-sm text-gray-500 mb-6">{selectedCard.set.toUpperCase()} • {selectedCard.rarity}</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Condition</label>
                                    <select
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

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring focus:ring-accent-blue focus:ring-opacity-50 p-2 border"
                                    >
                                        <option value="English">English</option>
                                        <option value="Spanish">Spanish</option>
                                        <option value="Japanese">Japanese</option>
                                        <option value="German">German</option>
                                        <option value="French">French</option>
                                        <option value="Italian">Italian</option>
                                        <option value="Portuguese">Portuguese</option>
                                        <option value="Russian">Russian</option>
                                        <option value="Korean">Korean</option>
                                        <option value="Chinese Simplified">Chinese Simplified</option>
                                        <option value="Chinese Traditional">Chinese Traditional</option>
                                    </select>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                                        <input
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
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price ({currency === 'EUR' ? '€' : '$'})</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(parseFloat(e.target.value))}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring focus:ring-accent-blue focus:ring-opacity-50 p-2 border"
                                    />
                                </div>

                                <button
                                    onClick={handleAddCard}
                                    className="w-full btn-primary mt-4 flex justify-center items-center gap-2"
                                >
                                    <span>Add to Collection</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

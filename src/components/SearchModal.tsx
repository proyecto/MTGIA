import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ScryfallCard, ScryfallCardList, AddCardArgs } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import FinishSelector from './FinishSelector';
import { LANGUAGE_NAMES } from '../constants';

/**
 * Props for the SearchModal component.
 */
interface SearchModalProps {
    /** Whether the modal is currently visible */
    isOpen: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback triggered when a card is successfully added */
    onCardAdded: (id: string) => void;
}



/**
 * Modal component for searching and adding cards from Scryfall.
 * Allows users to search by name, view details, and configure card properties (condition, language, finish) before adding.
 */
export default function SearchModal({ isOpen, onClose, onCardAdded }: SearchModalProps) {
    const { currency } = useSettings();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ScryfallCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCards, setTotalCards] = useState<number | undefined>(undefined);
    const [availableLanguages, setAvailableLanguages] = useState<string[]>(['en']);
    const [isFetchingLanguages, setIsFetchingLanguages] = useState(false);

    // Form state
    const [quantity, setQuantity] = useState(1);
    const [condition, setCondition] = useState('NM');
    const [language, setLanguage] = useState('English');
    const [finish, setFinish] = useState('nonfoil');
    const [price, setPrice] = useState(0);

    useEffect(() => {
        if (selectedCard) {
            // Auto-fill price based on selection and currency
            let priceStr;
            if (currency === 'EUR') {
                priceStr = finish.includes('foil') ? selectedCard.prices.eur_foil : selectedCard.prices.eur;
            } else {
                priceStr = finish.includes('foil') ? selectedCard.prices.usd_foil : selectedCard.prices.usd;
            }
            setPrice(priceStr ? parseFloat(priceStr) : 0);

            // Fetch available languages
            fetchLanguages(selectedCard);
        }
    }, [selectedCard, finish, currency]);

    async function fetchLanguages(card: ScryfallCard) {
        console.log('Fetching languages for:', card.name, 'Oracle ID:', card.oracle_id, 'Set:', card.set);
        if (!card.oracle_id) {
            console.log('No Oracle ID, defaulting to English');
            setAvailableLanguages(['en']);
            return;
        }

        setIsFetchingLanguages(true);
        try {
            const langs = await invoke<string[]>('get_card_languages', {
                oracleId: card.oracle_id,
                setCode: card.set
            });
            console.log('Received languages:', langs);

            // Map codes to names for sorting/display, but keep codes for value
            // If empty (shouldn't happen if card exists), default to English
            if (langs.length > 0) {
                setAvailableLanguages(langs);
                // If current language is not in available languages, switch to first available
                // Prefer English if available
                if (langs.includes('en')) {
                    setLanguage('en');
                } else if (!langs.includes(language)) {
                    setLanguage(langs[0]);
                }
            } else {
                console.log('No languages returned, defaulting to English');
                setAvailableLanguages(['en']);
                setLanguage('en');
            }
        } catch (error) {
            console.error('Failed to fetch languages:', error);
            setAvailableLanguages(['en']); // Fallback
        } finally {
            setIsFetchingLanguages(false);
        }
    }

    const search = useCallback(async (searchQuery: string, pageNum: number = 1) => {
        console.log(`Frontend searching: "${searchQuery}" Page: ${pageNum}`);
        if (!searchQuery.trim()) {
            setResults([]);
            setHasMore(false);
            setPage(1);
            return;
        }

        setLoading(true);
        try {
            const response = await invoke<ScryfallCardList>('search_scryfall', {
                query: searchQuery,
                page: pageNum
            });

            if (pageNum === 1) {
                setResults(response.data);
            } else {
                setResults(prev => [...prev, ...response.data]);
            }

            setHasMore(response.has_more);
            setTotalCards(response.total_cards);
            setPage(pageNum);
            console.log('Search response:', response);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    }, []); // No dependencies, as query is passed as an argument

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length > 2) {
                search(query, 1); // Always start a new search from page 1 when query changes
            } else {
                setResults([]);
                setHasMore(false);
                setPage(1);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, search]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            search(query, page + 1);
        }
    };

    async function handleAddCard() {
        if (!selectedCard) return;

        const args: AddCardArgs = {
            scryfall_id: selectedCard.id,
            condition,
            purchase_price: price,
            quantity,
            is_foil: finish.includes('foil'),

            language: LANGUAGE_NAMES[language] || language,
        };

        try {
            // We are passing the price directly, but the backend currently recalculates current_price from USD.
            // We should probably pass the currency preference to the backend too, or just let the backend store the purchase price as is.
            // For now, let's update the backend to respect the currency for current_price.
            await invoke('add_card', { args, currencyPreference: currency });
            onCardAdded(selectedCard.id); // Pass the card ID
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
        setQuantity(1);
        setCondition('NM');
        setLanguage('en');
        setFinish('nonfoil');
        setFinish('nonfoil');
        setPage(1);
        setHasMore(false);
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
                            <div className="text-xs text-gray-400 mb-2">
                                Found {totalCards ?? results.length} cards. Page {page}. Has more: {hasMore ? 'Yes' : 'No'}
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-2">
                                {loading && page === 1 && <div className="text-center text-gray-500 py-4">Searching...</div>}
                                {results.map((card) => (
                                    <div
                                        key={card.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-colors flex gap-3 ${selectedCard?.id === card.id
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-indigo-300'
                                            }`}
                                        onClick={() => setSelectedCard(card)}
                                    >
                                        {/* Card Image Thumbnail */}
                                        <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                            {card.image_uris?.small ? (
                                                <img
                                                    src={card.image_uris.small}
                                                    alt={card.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                    No Img
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">{card.name}</div>
                                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                                <span className="uppercase font-mono bg-gray-100 px-1 rounded text-xs">
                                                    {card.set}
                                                </span>
                                                <span className="truncate">{card.set_name}</span>
                                                <span className="text-gray-400">#{card.collector_number}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {hasMore && (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="w-full py-2 mt-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Loading...' : 'Load More Results'}
                                    </button>
                                )}
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
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Language {isFetchingLanguages && <span className="text-gray-400 font-normal">(Loading...)</span>}
                                        </label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            disabled={isFetchingLanguages}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring focus:ring-accent-blue focus:ring-opacity-50 p-2 border disabled:bg-gray-100"
                                        >
                                            {availableLanguages.map(langCode => (
                                                <option key={langCode} value={langCode}>
                                                    {LANGUAGE_NAMES[langCode] || langCode.toUpperCase()}
                                                </option>
                                            ))}
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

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Finish</label>
                                            <FinishSelector
                                                value={finish}
                                                onChange={setFinish}
                                            />
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
                                            data-testid="submit-collection"
                                            onClick={handleAddCard}
                                            className="w-full btn-primary mt-4 flex justify-center items-center gap-2"
                                        >
                                            <span>Add to Collection</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

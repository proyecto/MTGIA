import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CollectionCard } from '../types';

interface EditCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCardUpdated: () => void;
    card: CollectionCard | null;
}

export default function EditCardModal({ isOpen, onClose, onCardUpdated, card }: EditCardModalProps) {
    const [condition, setCondition] = useState('NM');
    const [language, setLanguage] = useState('English');
    const [purchasePrice, setPurchasePrice] = useState(0);

    useEffect(() => {
        if (card) {
            setCondition(card.condition);
            setLanguage(card.language || 'English');
            setPurchasePrice(card.purchase_price);
        }
    }, [card]);

    async function handleSave() {
        if (!card) return;

        try {
            await invoke('update_card_details', {
                id: card.id,
                condition,
                language,
                purchasePrice,
            });
            onCardUpdated();
            onClose();
        } catch (error) {
            console.error("Failed to update card:", error);
            alert(`Failed to update card: ${error}`);
        }
    }

    if (!isOpen || !card) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">Edit Card</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="text-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900">{card.name}</h3>
                        <p className="text-sm text-gray-500">{card.set_code.toUpperCase()}</p>
                    </div>

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

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price</label>
                        <input
                            type="number"
                            step="0.01"
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(parseFloat(e.target.value))}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring focus:ring-accent-blue focus:ring-opacity-50 p-2 border"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

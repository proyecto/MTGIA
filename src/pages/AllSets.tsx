import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ScryfallSet } from '../types';

export default function AllSets() {
    const [sets, setSets] = useState<ScryfallSet[]>([]);
    const [filteredSets, setFilteredSets] = useState<ScryfallSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSets();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredSets(sets);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = sets.filter(set =>
                set.name.toLowerCase().includes(query) ||
                set.code.toLowerCase().includes(query)
            );
            setFilteredSets(filtered);
        }
    }, [searchQuery, sets]);

    async function loadSets() {
        setLoading(true);
        setError(null);
        try {
            const result = await invoke<ScryfallSet[]>('get_sets');
            setSets(result);
            setFilteredSets(result);
        } catch (err) {
            console.error('Failed to load sets:', err);
            setError(typeof err === 'string' ? err : JSON.stringify(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleImportSets() {
        setLoading(true);
        setError(null);
        try {
            await invoke('import_sets');
            await loadSets();
        } catch (err) {
            console.error('Failed to import sets:', err);
            setError(typeof err === 'string' ? err : JSON.stringify(err));
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading sets...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Error: {error}</p>
                    <button onClick={loadSets} className="btn-primary">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (sets.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">📦</div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">No Sets Found</h2>
                    <p className="text-text-secondary mb-6">
                        Import sets from Scryfall to get started. This will download information about all Magic: The Gathering sets.
                    </p>
                    <button onClick={handleImportSets} className="btn-primary">
                        Import Sets from Scryfall
                    </button>
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
                        <h1 className="text-2xl font-bold text-text-primary">All Sets</h1>
                        <p className="text-sm text-text-secondary mt-1">
                            {filteredSets.length} {filteredSets.length === 1 ? 'set' : 'sets'}
                        </p>
                    </div>
                    <button
                        onClick={handleImportSets}
                        className="btn-secondary text-sm"
                        disabled={loading}
                    >
                        🔄 Refresh Sets
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search sets by name or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent outline-none"
                    />
                    <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Sets Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {filteredSets.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-text-secondary">No sets match your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredSets.map((set) => (
                            <div
                                key={set.code}
                                className="bg-white border border-border-color rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Set Icon */}
                                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                                        {set.icon_svg_uri ? (
                                            <img
                                                src={set.icon_svg_uri}
                                                alt={set.name}
                                                className="w-10 h-10 object-contain filter group-hover:brightness-110 transition-all"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                📦
                                            </div>
                                        )}
                                    </div>

                                    {/* Set Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-text-primary truncate group-hover:text-accent-blue transition-colors">
                                            {set.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded uppercase text-gray-600">
                                                {set.code}
                                            </span>
                                            {set.released_at && (
                                                <span className="text-xs text-text-secondary">
                                                    {new Date(set.released_at).getFullYear()}
                                                </span>
                                            )}
                                        </div>
                                        {set.card_count && (
                                            <p className="text-xs text-text-secondary mt-1">
                                                {set.card_count} cards
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

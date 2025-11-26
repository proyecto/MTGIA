import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Tag } from '../types';

interface TagManagerProps {
    onClose: () => void;
}

export default function TagManager({ onClose }: TagManagerProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3B82F6'); // Default blue
    const [error, setError] = useState('');

    const loadTags = async () => {
        try {
            const loadedTags = await invoke<Tag[]>('get_all_tags');
            setTags(loadedTags);
        } catch (err) {
            console.error('Failed to load tags:', err);
            setError('Failed to load tags');
        }
    };

    useEffect(() => {
        loadTags();
    }, []);

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;

        try {
            await invoke('create_tag', { name: newTagName, color: newTagColor });
            setNewTagName('');
            loadTags();
        } catch (err) {
            console.error('Failed to create tag:', err);
            setError('Failed to create tag. Name might be duplicate.');
        }
    };

    const handleDeleteTag = async (id: number) => {
        if (!confirm('Are you sure you want to delete this tag?')) return;
        try {
            await invoke('delete_tag', { id });
            loadTags();
        } catch (err) {
            console.error('Failed to delete tag:', err);
            setError('Failed to delete tag');
        }
    };

    const colors = [
        '#EF4444', // Red
        '#F97316', // Orange
        '#F59E0B', // Amber
        '#10B981', // Emerald
        '#06B6D4', // Cyan
        '#3B82F6', // Blue
        '#6366F1', // Indigo
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#6B7280', // Gray
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Manage Tags</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleCreateTag} className="mb-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="e.g., Commander, Trade, Foil"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                            <div className="flex flex-wrap gap-2">
                                {colors.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewTagColor(color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newTagColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                                            }`}
                                        style={{ backgroundColor: color }}
                                        aria-label={`Select color ${color}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!newTagName.trim()}
                            className="w-full py-2 px-4 bg-accent-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                            Create Tag
                        </button>
                    </form>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Existing Tags</h4>
                        {tags.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-4">No tags created yet</p>
                        ) : (
                            tags.map(tag => (
                                <div key={tag.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span className="text-gray-900 font-medium">{tag.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteTag(tag.id)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete tag"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

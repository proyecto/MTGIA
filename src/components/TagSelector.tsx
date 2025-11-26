import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Tag } from '../types';

interface TagSelectorProps {
    cardId: string;
    onTagsChange?: () => void;
}

const PRESET_COLORS = [
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

export default function TagSelector({ cardId, onTagsChange }: TagSelectorProps) {
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [assignedTags, setAssignedTags] = useState<Tag[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[5]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTags();
    }, [cardId]);

    async function loadTags() {
        try {
            const [all, assigned] = await Promise.all([
                invoke<Tag[]>('get_all_tags'),
                invoke<Tag[]>('get_card_tags', { cardId })
            ]);
            setAvailableTags(all);
            setAssignedTags(assigned);
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    }

    async function handleCreateTag() {
        if (!newTagName.trim()) return;
        setLoading(true);
        try {
            await invoke('create_tag', { name: newTagName, color: newTagColor });
            setNewTagName('');
            setIsCreating(false);
            await loadTags();
        } catch (error) {
            console.error('Failed to create tag:', error);
            alert('Failed to create tag');
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleTag(tag: Tag) {
        const isAssigned = assignedTags.some(t => t.id === tag.id);
        try {
            if (isAssigned) {
                await invoke('remove_tag_from_card', { cardId, tagId: tag.id });
            } else {
                await invoke('add_tag_to_card', { cardId, tagId: tag.id });
            }
            await loadTags();
            onTagsChange?.();
        } catch (error) {
            console.error('Failed to toggle tag:', error);
        }
    }

    async function handleDeleteTag(tagId: number, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this tag globally?')) return;

        try {
            await invoke('delete_tag', { id: tagId });
            await loadTags();
        } catch (error) {
            console.error('Failed to delete tag:', error);
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {assignedTags.map(tag => (
                    <span
                        key={tag.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tag.color }}
                    >
                        {tag.name}
                        <button
                            onClick={() => handleToggleTag(tag)}
                            className="ml-1.5 hover:text-gray-200 focus:outline-none"
                        >
                            &times;
                        </button>
                    </span>
                ))}
                {assignedTags.length === 0 && (
                    <span className="text-sm text-gray-500 italic">No tags assigned</span>
                )}
            </div>

            <div className="relative">
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="text-sm text-accent-blue hover:text-blue-600 font-medium flex items-center gap-1"
                >
                    {isCreating ? 'Cancel' : '+ Manage Tags'}
                </button>

                {isCreating && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Available Tags</h4>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                {availableTags.map(tag => {
                                    const isAssigned = assignedTags.some(t => t.id === tag.id);
                                    return (
                                        <div
                                            key={tag.id}
                                            onClick={() => handleToggleTag(tag)}
                                            className={`cursor-pointer inline-flex items-center px-2 py-1 rounded-md text-xs border transition-colors ${isAssigned
                                                    ? 'bg-gray-100 border-gray-300 opacity-50'
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full mr-1.5"
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            {tag.name}
                                            <button
                                                onClick={(e) => handleDeleteTag(tag.id, e)}
                                                className="ml-2 text-gray-400 hover:text-red-500"
                                                title="Delete tag globally"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    );
                                })}
                                {availableTags.length === 0 && (
                                    <span className="text-xs text-gray-400">No tags created yet</span>
                                )}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Create New Tag</h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    placeholder="Tag name..."
                                    className="flex-1 text-sm rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring-accent-blue"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                                />
                                <div className="flex gap-1">
                                    {PRESET_COLORS.slice(0, 5).map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setNewTagColor(color)}
                                            className={`w-6 h-6 rounded-full border-2 ${newTagColor === color ? 'border-gray-900' : 'border-transparent'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleCreateTag}
                                    disabled={loading || !newTagName.trim()}
                                    className="px-3 py-1 bg-accent-blue text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

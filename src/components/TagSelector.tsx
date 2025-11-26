import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Tag } from '../types';
import TagManager from './TagManager';

interface TagSelectorProps {
    cardId: string; // The database ID (UUID) of the card
    onTagsChanged?: () => void;
}

export default function TagSelector({ cardId, onTagsChanged }: TagSelectorProps) {
    const [assignedTags, setAssignedTags] = useState<Tag[]>([]);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showTagManager, setShowTagManager] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadData = async () => {
        try {
            const [cardTags, allTags] = await Promise.all([
                invoke<Tag[]>('get_card_tags', { cardId }),
                invoke<Tag[]>('get_all_tags')
            ]);
            setAssignedTags(cardTags);
            setAvailableTags(allTags);
        } catch (err) {
            console.error('Failed to load tags:', err);
        }
    };

    useEffect(() => {
        loadData();
    }, [cardId, showTagManager]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddTag = async (tagId: number) => {
        try {
            await invoke('add_tag_to_card', { cardId, tagId });
            await loadData();
            setIsDropdownOpen(false);
            onTagsChanged?.();
        } catch (err) {
            console.error('Failed to add tag:', err);
        }
    };

    const handleRemoveTag = async (tagId: number) => {
        try {
            await invoke('remove_tag_from_card', { cardId, tagId });
            await loadData();
            onTagsChanged?.();
        } catch (err) {
            console.error('Failed to remove tag:', err);
        }
    };

    const unassignedTags = availableTags.filter(
        tag => !assignedTags.some(assigned => assigned.id === tag.id)
    );

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {assignedTags.map(tag => (
                    <span
                        key={tag.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: tag.color }}
                    >
                        {tag.name}
                        <button
                            onClick={() => handleRemoveTag(tag.id)}
                            className="ml-1.5 hover:text-gray-200 focus:outline-none"
                        >
                            ×
                        </button>
                    </span>
                ))}

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200"
                    >
                        + Add Tag
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1 max-h-60 overflow-y-auto">
                            {unassignedTags.length > 0 ? (
                                unassignedTags.map(tag => (
                                    <button
                                        key={tag.id}
                                        onClick={() => handleAddTag(tag.id)}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        {tag.name}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-2 text-xs text-gray-400 italic">
                                    No more tags available
                                </div>
                            )}
                            <div className="border-t border-gray-100 mt-1 pt-1">
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        setShowTagManager(true);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-accent-blue hover:bg-blue-50 font-medium"
                                >
                                    Manage Tags...
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showTagManager && (
                <TagManager onClose={() => setShowTagManager(false)} />
            )}
        </div>
    );
}

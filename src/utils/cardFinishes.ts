// Card finish types and their display information
export const CARD_FINISHES = {
    // Standard finishes
    nonfoil: { label: 'Non-foil', icon: '📄', category: 'Standard' },
    foil: { label: 'Foil', icon: '⭐', category: 'Standard' },
    etched: { label: 'Etched Foil', icon: '✨', category: 'Standard' },

    // Special variants
    showcase: { label: 'Showcase', icon: '🎨', category: 'Special' },
    extended_art: { label: 'Extended Art', icon: '🖼️', category: 'Special' },
    borderless: { label: 'Borderless', icon: '🔲', category: 'Special' },
    full_art: { label: 'Full Art', icon: '🌅', category: 'Special' },

    // Promotional
    promo: { label: 'Promo', icon: '🎁', category: 'Promotional' },
    prerelease: { label: 'Prerelease', icon: '🎯', category: 'Promotional' },
    buy_a_box: { label: 'Buy-a-Box', icon: '📦', category: 'Promotional' },
    fnm: { label: 'FNM Promo', icon: '🏆', category: 'Promotional' },

    // Premium
    serialized: { label: 'Serialized', icon: '🔢', category: 'Premium' },
    gilded: { label: 'Gilded Foil', icon: '✨', category: 'Premium' },
    textured: { label: 'Textured Foil', icon: '🌟', category: 'Premium' },
} as const;

export type CardFinish = keyof typeof CARD_FINISHES;

export const getFinishLabel = (finish: string): string => {
    return CARD_FINISHES[finish as CardFinish]?.label || finish;
};

export const getFinishIcon = (finish: string): string => {
    return CARD_FINISHES[finish as CardFinish]?.icon || '📄';
};

export const getFinishCategory = (finish: string): string => {
    return CARD_FINISHES[finish as CardFinish]?.category || 'Standard';
};

// Group finishes by category for select dropdowns
export const getFinishesByCategory = () => {
    const categories: Record<string, Array<{ value: string; label: string; icon: string }>> = {};

    Object.entries(CARD_FINISHES).forEach(([value, { label, icon, category }]) => {
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push({ value, label, icon });
    });

    return categories;
};

/**
 * Determines if a finish represents a foil card.
 * @param finish - The finish value to check
 * @returns true if the finish is any type of foil, false otherwise
 */
export const isFinishFoil = (finish: string): boolean => {
    return finish !== 'nonfoil';
};

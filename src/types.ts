/**
 * Represents a card object returned by the Scryfall API.
 * Contains metadata, images, and pricing information.
 */
export interface ScryfallCard {
    /** Unique Scryfall ID */
    id: string;
    /** Card name */
    name: string;
    /** Set code (e.g., "dom") */
    set: string;
    /** Full set name */
    set_name: string;
    /** Collector number within the set */
    collector_number: string;
    /** Release date in YYYY-MM-DD format */
    released_at: string;
    /** Artist name */
    artist?: string;
    /** Image URIs for different sizes */
    image_uris?: {
        small: string;
        normal: string;
        large: string;
        png: string;
        art_crop: string;
        border_crop: string;
    };
    /** Market prices in different currencies */
    prices: {
        usd: string | null;
        usd_foil: string | null;
        eur: string | null;
        eur_foil: string | null;
    };
    /** Rarity (common, uncommon, rare, mythic) */
    rarity: string;
    similarity?: number; // Hamming distance (lower is better)
    /** Type line (e.g., "Creature — Elf Warrior") */
    type_line?: string;
    /** Oracle text (rules text) */
    oracle_text?: string;
    /** Oracle ID for grouping prints */
    oracle_id?: string;
    /** Language code */
    lang?: string;
}

/**
 * Represents a list of cards returned by Scryfall search.
 */
export interface ScryfallCardList {
    data: ScryfallCard[];
    has_more: boolean;
    total_cards?: number;
}

/**
 * Represents a card stored in the user's local collection.
 */
export interface CollectionCard {
    /** Unique UUID for the collection entry */
    id: string;
    /** Scryfall ID of the card */
    scryfall_id: string;
    /** Card name */
    name: string;
    /** Set code */
    set_code: string;
    /** Collector number */
    collector_number: string;
    /** Condition (NM, LP, MP, HP, DMG) */
    condition: string;
    /** Purchase price per unit */
    purchase_price: number;
    /** Current market price per unit */
    current_price: number;
    /** Quantity owned */
    quantity: number;
    /** Whether the card is foil */
    is_foil: boolean;
    /** Image URI */
    image_uri?: string;
    /** Language of the card */
    language: string;
    /** Finish of the card (nonfoil, foil, etched, etc.) */
    finish: string;
    /** Tags assigned to the card */
    tags?: Tag[];
}

/**
 * Arguments required to add a new card to the collection.
 */
export interface AddCardArgs {
    scryfall_id: string;
    condition: string;
    purchase_price: number;
    quantity: number;
    is_foil: boolean;
    language: string;
    finish?: string;
    tags?: string[];
}

/**
 * Represents a Magic: The Gathering set.
 */
export interface ScryfallSet {
    id: string;
    code: string;
    name: string;
    released_at?: string;
    icon_svg_uri?: string;
    set_type?: string;
    card_count?: number;
}

/**
 * Represents an item in the user's wishlist.
 */
export interface WishlistCard {
    id: string;
    scryfall_id: string;
    name: string;
    set_code: string;
    collector_number: string;
    image_uri?: string;
    target_price?: number;
    notes?: string;
    added_date: string;
    priority: number;
}

/**
 * A single data point for a card's price history.
 */
export interface CardPriceHistoryPoint {
    date: string;
    price: number;
    currency: string;
}

/**
 * Aggregated price statistics for a card.
 */
export interface PriceStats {
    min: number;
    max: number;
    average: number;
    current: number;
    change_percent: number;
}

/**
 * Performance metrics for a single card investment.
 */
export interface CardPerformance {
    id: string;
    name: string;
    set_code: string;
    quantity: number;
    purchase_price: number;
    current_price: number;
    total_gain: number;
    roi_percentage: number;
}

/**
 * Overall statistics for the entire collection.
 */
export interface CollectionStats {
    total_investment: number;
    total_value: number;
    total_gain: number;
    total_roi_percentage: number;
    top_winners: CardPerformance[];
    top_losers: CardPerformance[];
}

/**
 * Represents a custom tag for organizing cards.
 */
export interface Tag {
    id: number;
    name: string;
    color: string;
}

/**
 * Visual features detected from a card image.
 */
export interface CardFeatures {
    border_type: 'Black' | 'White' | 'Silver' | 'Unknown';
    frame_color: 'Black' | 'Blue' | 'Red' | 'Green' | 'White' | 'Gold' | 'Land' | 'Unknown';
    frame_style: 'OldFrame' | 'ModernFrame' | 'M15Frame' | 'Unknown';
    has_corner_dots: boolean;
    is_foil: boolean;
}

/**
 * Result from visual card recognition.
 */
export interface RecognitionResult {
    features: CardFeatures;
    detected_name: string;
    feature_description: string;
    search_query: string;
    candidates: ScryfallCard[];
}

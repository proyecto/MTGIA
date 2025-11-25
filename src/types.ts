export interface ScryfallCard {
    id: string;
    name: string;
    set: string;
    set_name: string;
    collector_number: string;
    released_at: string;
    artist?: string;
    image_uris?: {
        small: string;
        normal: string;
        large: string;
        png: string;
        art_crop: string;
        border_crop: string;
    };
    prices: {
        usd?: string;
        usd_foil?: string;
        eur?: string;
        eur_foil?: string;
    };
    rarity: string;
    type_line?: string;
    oracle_text?: string;
}

export interface CollectionCard {
    id: string;
    scryfall_id: string;
    name: string;
    set_code: string;
    collector_number: string;
    condition: string;
    purchase_price: number;
    current_price: number;
    quantity: number;
    is_foil: boolean;
    image_uri?: string;
    language: string;
}

export interface AddCardArgs {
    scryfall_id: string;
    condition: string;
    purchase_price: number;
    quantity: number;
    is_foil: boolean;
    language: string;
}

export interface ScryfallSet {
    id: string;
    code: string;
    name: string;
    released_at?: string;
    icon_svg_uri?: string;
    set_type?: string;
    card_count?: number;
}

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

export interface CardPriceHistoryPoint {
    date: string;
    price: number;
    currency: string;
}

export interface PriceStats {
    min: number;
    max: number;
    average: number;
    current: number;
    change_percent: number;
}

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

export interface CollectionStats {
    total_investment: number;
    total_value: number;
    total_gain: number;
    total_roi_percentage: number;
    top_winners: CardPerformance[];
    top_losers: CardPerformance[];
}

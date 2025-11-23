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
}

export interface AddCardArgs {
    scryfall_id: string;
    condition: string;
    purchase_price: number;
    quantity: number;
    is_foil: boolean;
}

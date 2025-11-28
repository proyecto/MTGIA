use serde::{Deserialize, Serialize};

/// Represents a Magic: The Gathering set from Scryfall.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScryfallSet {
    pub id: String,
    pub code: String,
    pub name: String,
    pub released_at: Option<String>,
    pub icon_svg_uri: Option<String>,
    pub set_type: Option<String>,
    pub card_count: Option<i32>,
}

/// Represents a list of sets returned by Scryfall.
#[derive(Debug, Serialize, Deserialize)]
pub struct ScryfallSetList {
    pub data: Vec<ScryfallSet>,
    pub has_more: bool,
}

/// Represents a list of cards returned by Scryfall search.
#[derive(Debug, Serialize, Deserialize)]
pub struct ScryfallCardList {
    pub data: Vec<ScryfallCard>,
    pub has_more: bool,
    pub total_cards: Option<i32>,
}

/// Represents a single Magic: The Gathering card from Scryfall.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScryfallCard {
    pub id: String,
    pub oracle_id: Option<String>,
    pub name: String,
    pub lang: Option<String>,
    pub set: String,
    pub set_name: String,
    pub collector_number: String,
    pub released_at: String,
    pub artist: Option<String>,
    pub image_uris: Option<ImageUris>,
    pub prices: Prices,
    pub rarity: String,
    #[serde(default, skip_deserializing)]
    pub similarity: Option<u32>, // Hamming distance (lower is better)
}

/// Represents the image URIs for a card.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImageUris {
    pub small: String,
    pub normal: String,
    pub large: String,
    pub png: String,
    pub art_crop: String,
    pub border_crop: String,
}

/// Represents the prices for a card in different currencies and finishes.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Prices {
    pub usd: Option<String>,
    pub usd_foil: Option<String>,
    pub eur: Option<String>,
    pub eur_foil: Option<String>,
}

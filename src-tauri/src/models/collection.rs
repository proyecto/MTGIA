use serde::{Deserialize, Serialize};

/// Represents a card in the user's collection.
#[derive(Debug, Serialize, Deserialize)]
pub struct CollectionCard {
    /// Unique UUID for this specific card instance in the collection
    pub id: String,
    /// Scryfall ID of the card
    pub scryfall_id: String,
    /// Card name
    pub name: String,
    /// Set code (e.g., "dom", "neo")
    pub set_code: String,
    /// Collector number in the set
    pub collector_number: String,
    /// Card condition (NM, LP, MP, HP, DMG)
    pub condition: String,
    /// Price paid for the card
    pub purchase_price: f64,
    /// Current market price
    pub current_price: f64,
    /// Quantity of this card
    pub quantity: i32,
    /// Whether the card is foil
    pub is_foil: bool,
    /// URI for the card image
    pub image_uri: Option<String>,
    /// Language of the card
    pub language: String,
    /// Finish of the card (nonfoil, foil, etched, etc.)
    pub finish: String,
}

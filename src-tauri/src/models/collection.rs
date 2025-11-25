use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CollectionCard {
    pub id: String,
    pub scryfall_id: String,
    pub name: String,
    pub set_code: String,
    pub collector_number: String,
    pub condition: String,
    pub purchase_price: f64,
    pub current_price: f64,
    pub quantity: i32,
    pub is_foil: bool,
    pub image_uri: Option<String>,
    pub language: String,
}

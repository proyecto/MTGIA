use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WishlistCard {
    pub id: String,
    pub scryfall_id: String,
    pub name: String,
    pub set_code: String,
    pub collector_number: String,
    pub image_uri: Option<String>,
    pub target_price: Option<f64>,
    pub notes: Option<String>,
    pub added_date: String,
    pub priority: i32,
}

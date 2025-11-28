use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CardPerformance {
    pub id: String,
    pub name: String,
    pub set_code: String,
    pub quantity: i32,
    pub purchase_price: f64,
    pub current_price: f64,
    pub total_gain: f64,
    pub roi_percentage: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CollectionStats {
    pub total_investment: f64,
    pub total_value: f64,
    pub total_gain: f64,
    pub total_roi_percentage: f64,
    pub total_cards: i32,
    pub unique_cards: i32,
    pub top_winners: Vec<CardPerformance>,
    pub top_losers: Vec<CardPerformance>,
    pub top_cards_by_price: Vec<CardPerformance>,
    pub set_distribution: Vec<(String, i32)>,
}

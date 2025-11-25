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
    pub top_winners: Vec<CardPerformance>,
    pub top_losers: Vec<CardPerformance>,
}

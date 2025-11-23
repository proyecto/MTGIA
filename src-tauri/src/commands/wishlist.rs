use crate::database::operations;
use crate::models::scryfall::ScryfallCard;
use crate::models::wishlist::WishlistCard;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn add_to_wishlist(
    state: State<'_, AppState>,
    card: ScryfallCard,
    target_price: Option<f64>,
    notes: Option<String>,
    priority: i32,
) -> Result<String, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::add_to_wishlist(&db, &card, target_price, notes, priority)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_wishlist(state: State<'_, AppState>) -> Result<Vec<WishlistCard>, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::get_wishlist(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_from_wishlist(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::remove_from_wishlist(&db, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_wishlist_card(
    state: State<'_, AppState>,
    id: String,
    target_price: Option<f64>,
    notes: Option<String>,
    priority: i32,
) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::update_wishlist_card(&db, &id, target_price, notes, priority)
        .map_err(|e| e.to_string())
}

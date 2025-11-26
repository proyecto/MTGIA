use crate::database::operations;
use crate::models::scryfall::ScryfallCard;
use crate::models::wishlist::WishlistCard;
use crate::AppState;
use tauri::State;

/// Adds a card to the wishlist.
///
/// # Arguments
///
/// * `state` - The application state.
/// * `card` - The Scryfall card data.
/// * `target_price` - Optional target price.
/// * `notes` - Optional notes.
/// * `priority` - Priority level (1-3).
///
/// # Returns
///
/// * `Result<String, String>` - The UUID of the newly created wishlist item or an error message.
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

/// Retrieves all items from the wishlist.
///
/// # Arguments
///
/// * `state` - The application state.
///
/// # Returns
///
/// * `Result<Vec<WishlistCard>, String>` - A list of wishlist items or an error message.
#[tauri::command]
pub fn get_wishlist(state: State<'_, AppState>) -> Result<Vec<WishlistCard>, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::get_wishlist(&db).map_err(|e| e.to_string())
}

/// Removes an item from the wishlist.
///
/// # Arguments
///
/// * `state` - The application state.
/// * `id` - The UUID of the wishlist item.
///
/// # Returns
///
/// * `Result<(), String>` - Ok if successful, or an error message.
#[tauri::command]
pub fn remove_from_wishlist(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::remove_from_wishlist(&db, &id).map_err(|e| e.to_string())
}

/// Updates a wishlist item.
///
/// # Arguments
///
/// * `state` - The application state.
/// * `id` - The UUID of the wishlist item.
/// * `target_price` - New target price.
/// * `notes` - New notes.
/// * `priority` - New priority.
///
/// # Returns
///
/// * `Result<(), String>` - Ok if successful, or an error message.
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

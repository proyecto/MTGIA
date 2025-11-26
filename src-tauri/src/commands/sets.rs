use crate::services::scryfall::ScryfallService;
use crate::AppState;
use tauri::State;

/// Fetches cards from a specific set with pagination.
///
/// # Arguments
///
/// * `_state` - The application state (unused).
/// * `set_code` - The set code (e.g., "dom").
/// * `page` - The page number (1-indexed).
///
/// # Returns
///
/// * `Result<ScryfallCardList, String>` - A paginated list of cards or an error message.
#[tauri::command]
pub async fn get_set_cards(
    _state: State<'_, AppState>,
    set_code: String,
    page: u32,
) -> Result<crate::models::scryfall::ScryfallCardList, String> {
    let service = ScryfallService::new();
    service
        .fetch_cards_by_set(&set_code, page)
        .await
        .map_err(|e| e.to_string())
}

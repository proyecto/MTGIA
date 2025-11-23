use crate::models::scryfall::ScryfallCard;
use crate::services::scryfall::ScryfallService;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn get_set_cards(
    _state: State<'_, AppState>,
    set_code: String,
) -> Result<Vec<ScryfallCard>, String> {
    let service = ScryfallService::new();
    service
        .fetch_cards_by_set(&set_code)
        .await
        .map_err(|e| e.to_string())
}

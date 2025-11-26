use crate::services::scryfall::ScryfallService;
use crate::AppState;
use tauri::State;

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

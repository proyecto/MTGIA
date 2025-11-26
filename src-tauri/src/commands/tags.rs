use crate::database::operations::{self, Tag};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn create_tag(
    state: State<'_, AppState>,
    name: String,
    color: String,
) -> Result<i32, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::create_tag(&db, &name, &color).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_tag(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::delete_tag(&db, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_tags(state: State<'_, AppState>) -> Result<Vec<Tag>, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::get_all_tags(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_tag_to_card(
    state: State<'_, AppState>,
    card_id: String,
    tag_id: i32,
) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::add_tag_to_card(&db, &card_id, tag_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_tag_from_card(
    state: State<'_, AppState>,
    card_id: String,
    tag_id: i32,
) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::remove_tag_from_card(&db, &card_id, tag_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_card_tags(
    state: State<'_, AppState>,
    card_id: String,
) -> Result<Vec<Tag>, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::get_card_tags(&db, &card_id).map_err(|e| e.to_string())
}

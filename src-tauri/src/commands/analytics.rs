use crate::database::operations;
use crate::models::analytics::CollectionStats;
use crate::AppState;
use tauri::State;

/// Calculates statistics for the entire collection.
///
/// # Arguments
///
/// * `state` - The application state.
///
/// # Returns
///
/// * `Result<CollectionStats, String>` - The calculated statistics or an error message.
#[tauri::command]
pub async fn get_collection_stats(state: State<'_, AppState>) -> Result<CollectionStats, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;

    operations::get_collection_stats(&db).map_err(|e| e.to_string())
}

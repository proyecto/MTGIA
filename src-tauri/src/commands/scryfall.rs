use tauri::{AppHandle, State};

use crate::database::operations;
use crate::services::scryfall::ScryfallService;
use crate::AppState;

use tauri::Emitter;

#[derive(Clone, serde::Serialize)]
struct ProgressPayload {
    current: usize,
    total: usize,
    message: String,
}

/// Imports all sets from Scryfall into the local database.
/// Emits progress events to the frontend.
///
/// # Arguments
///
/// * `app` - The application handle to emit events.
/// * `state` - The application state.
///
/// # Returns
///
/// * `Result<String, String>` - A summary message or an error string.
#[tauri::command]
pub async fn import_sets(app: AppHandle, state: State<'_, AppState>) -> Result<String, String> {
    let service = ScryfallService::new();
    let sets = service.fetch_sets().await.map_err(|e| e.to_string())?;

    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;

    let total = sets.len();
    println!("Found {} sets to import", total);
    let mut count = 0;

    for (i, set) in sets.iter().enumerate() {
        operations::insert_set(&db, set).map_err(|e| e.to_string())?;
        count += 1;

        // Emit progress every 10 items or on the last one to avoid flooding
        if i % 10 == 0 || i == total - 1 {
            println!("Emitting progress: {}/{}", i + 1, total);
            app.emit(
                "import-progress",
                ProgressPayload {
                    current: i + 1,
                    total,
                    message: format!("Importing set: {}", set.name),
                },
            )
            .map_err(|e| e.to_string())?;
        }
    }

    Ok(format!("Imported {} sets", count))
}

/// Retrieves all sets from the local database.
/// If the database is empty, it fetches them from Scryfall first.
///
/// # Arguments
///
/// * `state` - The application state.
///
/// # Returns
///
/// * `Result<Vec<ScryfallSet>, String>` - A list of sets or an error string.
#[tauri::command]
pub async fn get_sets(
    state: State<'_, AppState>,
) -> Result<Vec<crate::models::scryfall::ScryfallSet>, String> {
    // Check if database has sets
    let is_empty = {
        let db = state
            .db
            .lock()
            .map_err(|_| "Failed to lock db".to_string())?;
        let sets = operations::get_all_sets(&db).map_err(|e| e.to_string())?;
        let empty = sets.is_empty();

        if !empty {
            return Ok(sets);
        }
        empty
    }; // db lock is released here

    // If database is empty, fetch from Scryfall
    if is_empty {
        let service = ScryfallService::new();
        let scryfall_sets = service.fetch_sets().await.map_err(|e| e.to_string())?;

        // Store in database
        {
            let db = state
                .db
                .lock()
                .map_err(|_| "Failed to lock db".to_string())?;
            for set in &scryfall_sets {
                operations::insert_set(&db, set).map_err(|e| e.to_string())?;
            }
        } // db lock is released here

        Ok(scryfall_sets)
    } else {
        Err("Unexpected state".to_string())
    }
}

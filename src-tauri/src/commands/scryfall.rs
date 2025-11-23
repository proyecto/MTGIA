use tauri::{State, AppHandle};

use crate::services::scryfall::ScryfallService;
use crate::database::operations;
use crate::AppState;

use tauri::Emitter;

#[derive(Clone, serde::Serialize)]
struct ProgressPayload {
    current: usize,
    total: usize,
    message: String,
}

#[tauri::command]
pub async fn import_sets(app: AppHandle, state: State<'_, AppState>) -> Result<String, String> {
    let service = ScryfallService::new();
    let sets = service.fetch_sets().await.map_err(|e| e.to_string())?;
    
    let db = state.db.lock().map_err(|_| "Failed to lock db".to_string())?;
    
    let total = sets.len();
    println!("Found {} sets to import", total);
    let mut count = 0;
    
    for (i, set) in sets.iter().enumerate() {
        operations::insert_set(&db, set).map_err(|e| e.to_string())?;
        count += 1;
        
        // Emit progress every 10 items or on the last one to avoid flooding
        if i % 10 == 0 || i == total - 1 {
            println!("Emitting progress: {}/{}", i + 1, total);
            app.emit("import-progress", ProgressPayload {
                current: i + 1,
                total,
                message: format!("Importing set: {}", set.name),
            }).map_err(|e| e.to_string())?;
        }
    }
    
    Ok(format!("Imported {} sets", count))
}

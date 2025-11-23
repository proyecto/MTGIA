// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

mod database;
mod models;
mod services;
mod commands;

use tauri::Manager;
use std::sync::Mutex;
use rusqlite::Connection;

pub struct AppState {
    pub db: Mutex<Connection>,
}

#[tauri::command]
fn init_db_command(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("mtg_collection.db");
    
    // Re-initialize or verify connection here if needed, but for now we just return path
    Ok(format!("Database initialized at {:?}", db_path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            let db_path = app_dir.join("mtg_collection.db");
            
            let conn = database::init_db(&db_path).expect("failed to init db");
            
            app.manage(AppState {
                db: Mutex::new(conn),
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet, 
            init_db_command,
            commands::scryfall::import_sets,
            commands::collection::add_card,
            commands::collection::search_scryfall,
            commands::collection::get_collection,
            commands::collection::remove_card,
            commands::collection::update_card_quantity
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

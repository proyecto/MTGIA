use tauri::State;
use crate::AppState;
use crate::database::operations;
use crate::services::scryfall::ScryfallService;
use crate::models::scryfall::ScryfallCard;
use uuid::Uuid;

#[derive(serde::Deserialize)]
pub struct AddCardArgs {
    pub scryfall_id: String,
    pub condition: String,
    pub purchase_price: f64,
    pub quantity: i32,
    pub is_foil: bool,
}

#[tauri::command]
pub async fn add_card(state: State<'_, AppState>, args: AddCardArgs, currency_preference: String) -> Result<String, String> {
    let service = ScryfallService::new();
    let card = service.fetch_card(&args.scryfall_id).await.map_err(|e| e.to_string())?;
    
    let db = state.db.lock().map_err(|_| "Failed to lock db".to_string())?;
    
    let id = Uuid::new_v4().to_string();
    
    operations::insert_card(&db, &id, &card, &args, &currency_preference).map_err(|e| e.to_string())?;
    
    Ok(id)
}

#[tauri::command]
pub async fn search_scryfall(query: String) -> Result<Vec<ScryfallCard>, String> {
    let service = ScryfallService::new();
    service.search_cards(&query).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_collection(state: State<'_, AppState>) -> Result<Vec<crate::models::collection::CollectionCard>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock db".to_string())?;
    operations::get_all_cards(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_card(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|_| "Failed to lock db".to_string())?;
    operations::remove_card(&db, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_card_quantity(state: State<'_, AppState>, id: String, quantity: i32) -> Result<(), String> {
    let db = state.db.lock().map_err(|_| "Failed to lock db".to_string())?;
    operations::update_card_quantity(&db, &id, quantity).map_err(|e| e.to_string())
}

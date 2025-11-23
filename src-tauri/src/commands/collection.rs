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

#[tauri::command]
pub async fn update_prices(state: State<'_, AppState>, currency_preference: String) -> Result<String, String> {
    let service = crate::services::prices::PriceService::new();
    
    // Extract card data while holding the lock, then release it
    let cards = {
        let db = state.db.lock().map_err(|_| "Failed to lock db".to_string())?;
        operations::get_all_cards(&db).map_err(|e| e.to_string())?
    };
    
    // Now do async work without holding the lock
    let mut updated_count = 0;
    for card in cards {
        std::thread::sleep(std::time::Duration::from_millis(100));
        
        match service.fetch_and_update_price(&card, &currency_preference).await {
            Ok(Some(price)) => {
                // Re-acquire lock for each update
                let db = state.db.lock().map_err(|_| "Failed to lock db".to_string())?;
                operations::update_card_price(&db, &card.id, price).map_err(|e| e.to_string())?;
                operations::insert_price_history(&db, &card.id, price, &currency_preference).map_err(|e| e.to_string())?;
                updated_count += 1;
            },
            Ok(None) => {
                println!("No price available for {}", card.name);
            },
            Err(e) => {
                println!("Failed to fetch price for {}: {}", card.name, e);
            }
        }
    }
    
    Ok(format!("Updated prices for {} cards", updated_count))
}

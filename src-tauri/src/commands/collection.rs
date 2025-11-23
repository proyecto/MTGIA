use crate::database::operations;
use crate::models::scryfall::ScryfallCard;
use crate::services::scryfall::ScryfallService;
use crate::AppState;
use tauri::State;
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
pub async fn add_card(
    state: State<'_, AppState>,
    args: AddCardArgs,
    currency_preference: String,
) -> Result<String, String> {
    let service = ScryfallService::new();
    let card = service
        .fetch_card(&args.scryfall_id)
        .await
        .map_err(|e| e.to_string())?;

    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;

    let id = Uuid::new_v4().to_string();

    operations::insert_card(&db, &id, &card, &args, &currency_preference)
        .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn search_scryfall(query: String) -> Result<Vec<ScryfallCard>, String> {
    let service = ScryfallService::new();
    service
        .search_cards(&query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_card(scryfall_id: String) -> Result<ScryfallCard, String> {
    let service = ScryfallService::new();
    service
        .fetch_card(&scryfall_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_collection(
    state: State<'_, AppState>,
) -> Result<Vec<crate::models::collection::CollectionCard>, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::get_all_cards(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_card(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::remove_card(&db, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_card_quantity(
    state: State<'_, AppState>,
    id: String,
    quantity: i32,
) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::update_card_quantity(&db, &id, quantity).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_prices(
    state: State<'_, AppState>,
    currency_preference: String,
) -> Result<String, String> {
    let service = crate::services::prices::PriceService::new();

    // Extract card data while holding the lock, then release it
    let cards = {
        let db = state
            .db
            .lock()
            .map_err(|_| "Failed to lock db".to_string())?;
        operations::get_all_cards(&db).map_err(|e| e.to_string())?
    };

    // Now do async work without holding the lock
    let mut updated_count = 0;
    for card in cards {
        std::thread::sleep(std::time::Duration::from_millis(100));

        match service
            .fetch_and_update_price(&card, &currency_preference)
            .await
        {
            Ok(Some(price)) => {
                // Re-acquire lock for each update
                let db = state
                    .db
                    .lock()
                    .map_err(|_| "Failed to lock db".to_string())?;
                operations::update_card_price(&db, &card.id, price).map_err(|e| e.to_string())?;
                operations::insert_price_history(&db, &card.id, price, &currency_preference)
                    .map_err(|e| e.to_string())?;
                updated_count += 1;
            }
            Ok(None) => {
                println!("No price available for {}", card.name);
            }
            Err(e) => {
                println!("Failed to fetch price for {}: {}", card.name, e);
            }
        }
    }

    Ok(format!("Updated prices for {} cards", updated_count))
}

#[tauri::command]
pub async fn update_card_details(
    state: State<'_, AppState>,
    id: String,
    condition: String,
    purchase_price: f64,
) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::update_card_details(&db, &id, &condition, purchase_price).map_err(|e| e.to_string())
}

#[derive(serde::Serialize)]
pub struct PortfolioDataPoint {
    date: String,
    total_value: f64,
    total_investment: f64,
}

#[tauri::command]
pub async fn get_portfolio_history(
    state: State<'_, AppState>,
) -> Result<Vec<PortfolioDataPoint>, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;

    // Get all unique dates from price history
    let mut dates_stmt = db
        .prepare("SELECT DISTINCT date FROM price_history ORDER BY date ASC")
        .map_err(|e| e.to_string())?;

    let dates: Vec<String> = dates_stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut history = Vec::new();

    for date in dates {
        // Get total value for this date
        let total_value: f64 = db
            .query_row(
                "SELECT SUM(price) FROM price_history WHERE date = ?1",
                [&date],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        // Get total investment (sum of purchase prices for all cards in collection)
        let total_investment: f64 = db
            .query_row(
                "SELECT SUM(purchase_price * quantity) FROM cards",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        history.push(PortfolioDataPoint {
            date,
            total_value,
            total_investment,
        });
    }

    Ok(history)
}

#[tauri::command]
pub async fn export_collection(state: State<'_, AppState>) -> Result<String, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    let cards = operations::get_all_cards(&db).map_err(|e| e.to_string())?;

    // Create CSV header
    let mut csv = String::from("name,set_code,collector_number,condition,purchase_price,current_price,quantity,is_foil,scryfall_id\n");

    // Add each card as a row
    for card in cards {
        csv.push_str(&format!(
            "\"{}\",{},{},{},{},{},{},{},{}\n",
            card.name.replace("\"", "\"\""), // Escape quotes
            card.set_code,
            card.collector_number,
            card.condition,
            card.purchase_price,
            card.current_price,
            card.quantity,
            if card.is_foil { 1 } else { 0 },
            card.scryfall_id
        ));
    }

    Ok(csv)
}

#[tauri::command]
pub async fn import_collection(
    state: State<'_, AppState>,
    csv_content: String,
) -> Result<String, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;

    let lines: Vec<&str> = csv_content.lines().collect();
    if lines.is_empty() {
        return Err("CSV file is empty".to_string());
    }

    let mut imported = 0;
    let mut skipped = 0;

    // Skip header (first line)
    for line in lines.iter().skip(1) {
        if line.trim().is_empty() {
            continue;
        }

        // Simple CSV parsing (handles quoted fields)
        let parts: Vec<String> = parse_csv_line(line);

        if parts.len() < 9 {
            skipped += 1;
            continue;
        }

        let name = &parts[0];
        let set_code = &parts[1];
        let collector_number = &parts[2];
        let condition = &parts[3];
        let purchase_price: f64 = parts[4].parse().unwrap_or(0.0);
        let current_price: f64 = parts[5].parse().unwrap_or(0.0);
        let quantity: i32 = parts[6].parse().unwrap_or(1);
        let is_foil = parts[7] == "1" || parts[7].to_lowercase() == "true";
        let scryfall_id = &parts[8];

        // Generate a unique ID
        let id = uuid::Uuid::new_v4().to_string();

        match db.execute(
            "INSERT INTO cards (id, scryfall_id, name, set_code, collector_number, condition, purchase_price, current_price, quantity, is_foil) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![id, scryfall_id, name, set_code, collector_number, condition, purchase_price, current_price, quantity, is_foil],
        ) {
            Ok(_) => imported += 1,
            Err(_) => skipped += 1,
        }
    }

    Ok(format!(
        "Imported {} cards, skipped {} cards",
        imported, skipped
    ))
}

fn parse_csv_line(line: &str) -> Vec<String> {
    let mut parts = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut chars = line.chars().peekable();

    while let Some(c) = chars.next() {
        match c {
            '"' => {
                if in_quotes && chars.peek() == Some(&'"') {
                    current.push('"');
                    chars.next();
                } else {
                    in_quotes = !in_quotes;
                }
            }
            ',' if !in_quotes => {
                parts.push(current.clone());
                current.clear();
            }
            _ => current.push(c),
        }
    }
    parts.push(current);
    parts
}

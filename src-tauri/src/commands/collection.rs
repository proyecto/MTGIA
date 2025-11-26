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
    pub language: String,
    pub finish: Option<String>,
    pub tags: Option<Vec<String>>, // List of "Name:Color" strings
}

/// Adds a new card to the user's collection.
/// Fetches card data from Scryfall first.
///
/// # Arguments
///
/// * `state` - The application state containing the database connection.
/// * `args` - The arguments for adding the card (Scryfall ID, condition, etc.).
/// * `currency_preference` - The user's preferred currency.
///
/// # Returns
///
/// * `Result<String, String>` - The UUID of the added card or an error message.
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

/// Searches for cards using the Scryfall API.
///
/// # Arguments
///
/// * `query` - The search query string.
///
/// # Returns
///
/// * `Result<Vec<ScryfallCard>, String>` - A list of matching cards or an error message.
#[tauri::command]
pub async fn search_scryfall(
    query: String,
    page: u32,
) -> Result<crate::models::scryfall::ScryfallCardList, String> {
    let service = ScryfallService::new();
    service
        .search_cards(&query, page)
        .await
        .map_err(|e| e.to_string())
}

/// Fetches a single card from Scryfall by its ID.
///
/// # Arguments
///
/// * `scryfall_id` - The Scryfall ID of the card.
///
/// # Returns
///
/// * `Result<ScryfallCard, String>` - The card data or an error message.
#[tauri::command]
pub async fn get_card(scryfall_id: String) -> Result<ScryfallCard, String> {
    let service = ScryfallService::new();
    service
        .fetch_card(&scryfall_id)
        .await
        .map_err(|e| e.to_string())
}

/// Fetches available languages for a specific card in a set.
///
/// # Arguments
///
/// * `oracle_id` - The Oracle ID of the card.
/// * `set_code` - The set code.
///
/// # Returns
///
/// * `Result<Vec<String>, String>` - A list of language codes.
#[tauri::command]
pub async fn get_card_languages(
    oracle_id: String,
    set_code: String,
) -> Result<Vec<String>, String> {
    let service = ScryfallService::new();
    service
        .get_card_languages(&oracle_id, &set_code)
        .await
        .map_err(|e| e.to_string())
}

/// Retrieves the entire collection of cards.
///
/// # Arguments
///
/// * `state` - The application state.
///
/// # Returns
///
/// * `Result<Vec<CollectionCard>, String>` - The list of cards in the collection.
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

/// Removes a card from the collection.
///
/// # Arguments
///
/// * `state` - The application state.
/// * `id` - The UUID of the card to remove.
///
/// # Returns
///
/// * `Result<(), String>` - Ok if successful, or an error message.
#[tauri::command]
pub async fn remove_card(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::remove_card(&db, &id).map_err(|e| e.to_string())
}

/// Updates the quantity of a card in the collection.
///
/// # Arguments
///
/// * `state` - The application state.
/// * `id` - The UUID of the card.
/// * `quantity` - The new quantity.
///
/// # Returns
///
/// * `Result<(), String>` - Ok if successful, or an error message.
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

/// Updates prices for all cards in the collection.
/// This is a long-running operation that fetches latest prices from Scryfall.
///
/// # Arguments
///
/// * `state` - The application state.
/// * `currency_preference` - The currency to use for price updates.
///
/// # Returns
///
/// * `Result<String, String>` - A summary message of the update operation.
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

/// Updates details of a specific card.
///
/// # Arguments
///
/// * `state` - The application state.
/// * `id` - The UUID of the card.
/// * `condition` - The new condition.
/// * `language` - The new language.
/// * `purchase_price` - The new purchase price.
///
/// # Returns
///
/// * `Result<(), String>` - Ok if successful, or an error message.
#[tauri::command]
pub async fn update_card_details(
    state: State<'_, AppState>,
    id: String,
    condition: String,
    language: String,
    purchase_price: f64,
) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    operations::update_card_details(&db, &id, &condition, &language, purchase_price)
        .map_err(|e| e.to_string())
}

/// Represents a data point in the portfolio value history.
#[derive(serde::Serialize)]
pub struct PortfolioDataPoint {
    /// The date of the data point (YYYY-MM-DD).
    date: String,
    /// The total market value of the collection on this date.
    total_value: f64,
    /// The total investment cost of the collection on this date.
    total_investment: f64,
}

/// Retrieves the history of the total portfolio value over time.
///
/// # Arguments
///
/// * `state` - The application state.
///
/// # Returns
///
/// * `Result<Vec<PortfolioDataPoint>, String>` - A list of data points representing portfolio value history.
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
        // Get total value for this date by joining with cards table to get quantities
        let total_value: f64 = db
            .query_row(
                "SELECT SUM(ph.price * c.quantity) 
                 FROM price_history ph
                 JOIN cards c ON ph.card_id = c.id
                 WHERE ph.date = ?1",
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

/// Retrieves the price history for a specific card.
///
/// # Arguments
///
/// * `state` - The application state.
/// * `card_id` - The UUID of the card.
///
/// # Returns
///
/// * `Result<Vec<CardPriceHistoryPoint>, String>` - A list of price history points.
#[tauri::command]
pub async fn get_card_price_history(
    state: State<'_, AppState>,
    card_id: String,
) -> Result<Vec<operations::CardPriceHistoryPoint>, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;

    operations::get_card_price_history(&db, &card_id).map_err(|e| e.to_string())
}

/// Exports the entire collection to a CSV string.
///
/// # Arguments
///
/// * `state` - The application state.
///
/// # Returns
///
/// * `Result<String, String>` - The CSV content string.
#[tauri::command]
pub async fn export_collection(state: State<'_, AppState>) -> Result<String, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Failed to lock db".to_string())?;
    let cards = operations::get_all_cards(&db).map_err(|e| e.to_string())?;

    // Create CSV header
    let mut csv = String::from("name,set_code,collector_number,condition,purchase_price,current_price,quantity,is_foil,language,finish,tags,scryfall_id\n");

    // Add each card as a row
    for card in cards {
        let tags_str = card
            .tags
            .as_ref()
            .map(|t| {
                t.iter()
                    .map(|tag| format!("{}:{}", tag.name, tag.color))
                    .collect::<Vec<_>>()
                    .join(";")
            })
            .unwrap_or_default();

        csv.push_str(&format!(
            "\"{}\",{},{},{},{},{},{},{},\"{}\",\"{}\",\"{}\",{}\n",
            card.name.replace("\"", "\"\""), // Escape quotes
            card.set_code,
            card.collector_number,
            card.condition,
            card.purchase_price,
            card.current_price,
            card.quantity,
            if card.is_foil { 1 } else { 0 },
            card.language.replace("\"", "\"\""), // Escape quotes in language
            card.finish.replace("\"", "\"\""),
            tags_str.replace("\"", "\"\""),
            card.scryfall_id
        ));
    }

    Ok(csv)
}

/// Imports a collection from a CSV string.
///
/// # Arguments
///
/// * `state` - The application state.
/// * `csv_content` - The CSV content to import.
///
/// # Returns
///
/// * `Result<String, String>` - A summary message of the import operation.
#[tauri::command]
pub async fn import_collection(
    state: State<'_, AppState>,
    csv_content: String,
) -> Result<String, String> {
    // Parse CSV first without lock
    let import_service = crate::services::import::ImportService::new();
    let cards = import_service
        .parse_csv(&csv_content)
        .map_err(|e| e.to_string())?;

    if cards.is_empty() {
        return Err("No cards found in CSV".to_string());
    }

    let mut imported = 0;
    let mut skipped = 0;

    let scryfall_service = ScryfallService::new();

    for card in cards {
        let mut scryfall_id = card.scryfall_id.clone();
        let mut scryfall_card_data = None;

        // 1. Resolve Scryfall ID (Async, no lock needed)
        if scryfall_id.is_none() {
            if let Some(set) = &card.set_code {
                if let Some(cn) = &card.collector_number {
                    let query = format!("set:{} cn:{}", set, cn);
                    if let Ok(results) = scryfall_service.search_cards(&query, 1).await {
                        if let Some(first) = results.data.first() {
                            scryfall_id = Some(first.id.clone());
                            scryfall_card_data = Some(first.clone());
                        }
                    }
                } else {
                    let query = format!("!\"{}\" set:{}", card.name, set);
                    if let Ok(results) = scryfall_service.search_cards(&query, 1).await {
                        if let Some(first) = results.data.first() {
                            scryfall_id = Some(first.id.clone());
                            scryfall_card_data = Some(first.clone());
                        }
                    }
                }
            } else {
                let query = format!("!\"{}\"", card.name);
                if let Ok(results) = scryfall_service.search_cards(&query, 1).await {
                    if let Some(first) = results.data.first() {
                        scryfall_id = Some(first.id.clone());
                        scryfall_card_data = Some(first.clone());
                    }
                }
            }
        }

        // 2. Fetch Card Data if needed (Async, no lock needed)
        if let Some(sid) = scryfall_id {
            let card_data = if let Some(data) = scryfall_card_data {
                data
            } else {
                match scryfall_service.fetch_card(&sid).await {
                    Ok(data) => data,
                    Err(_) => {
                        skipped += 1;
                        continue;
                    }
                }
            };

            // 3. Insert into DB (Needs lock)
            let id = uuid::Uuid::new_v4().to_string();
            let args = AddCardArgs {
                scryfall_id: sid,
                condition: card.condition,
                purchase_price: 0.0,
                quantity: card.quantity,
                is_foil: card.is_foil,
                language: card.language,
                finish: Some(card.finish),
                tags: card.tags.map(|t| vec![t]),
            };

            {
                let db = state
                    .db
                    .lock()
                    .map_err(|_| "Failed to lock db".to_string())?;

                match operations::insert_card(&db, &id, &card_data, &args, "USD") {
                    Ok(_) => imported += 1,
                    Err(_) => skipped += 1,
                }
            }

            std::thread::sleep(std::time::Duration::from_millis(50));
        } else {
            skipped += 1;
        }
    }

    Ok(format!(
        "Imported {} cards, skipped {} cards",
        imported, skipped
    ))
}

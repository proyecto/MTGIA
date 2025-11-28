// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
/// A simple greeting command.
///
/// # Arguments
///
/// * `name` - The name to greet.
///
/// # Returns
///
/// * `String` - A greeting message.
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct RecognitionResult {
    pub features: card_features::CardFeatures,
    pub detected_name: String,
    pub feature_description: String,
    pub search_query: String,
    pub candidates: Vec<models::scryfall::ScryfallCard>,
}

/// Recognize a card using visual features and optional OCR
#[tauri::command]
async fn recognize_card_with_features(
    state: tauri::State<'_, AppState>,
    image_data: String,
) -> Result<RecognitionResult, String> {
    use crate::card_features::extract_card_features;
    use crate::card_filter::{build_search_query, describe_features};
    use base64::prelude::*;
    
    // Decode base64 image
    let image_bytes = BASE64_STANDARD.decode(&image_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    
    // Extract visual features
    let features = extract_card_features(&image_bytes)?;

    // --- Phase 2: Offline Recognition (Local DB) ---
    // Check if we have this card in our collection already using pHash
    // This is instant and works offline
    let user_image = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Failed to load image for hashing: {}", e))?;
    let user_hash = crate::card_features::calculate_phash(&user_image);
    let user_hash_str = format!("{:x}", user_hash);
    
    // Check local DB for matches
    let local_match = {
        let db = state.db.lock().map_err(|_| "Failed to lock db".to_string())?;
        let mut stmt = db.prepare(
            "SELECT scryfall_id, name, set_code, collector_number, image_uri, phash FROM cards WHERE phash IS NOT NULL"
        ).map_err(|e| e.to_string())?;
        
        let card_iter = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, String>(5)?,
            ))
        }).map_err(|e| e.to_string())?;
        
        let mut best_match: Option<(String, u32)> = None; // (scryfall_id, distance)
        let mut best_card_data = None;
        
        for card in card_iter {
            if let Ok((sid, name, set, cn, img, hash_str)) = card {
                if let Ok(hash) = u64::from_str_radix(&hash_str, 16) {
                    let dist = crate::card_features::hamming_distance(user_hash, hash);
                    
                    if dist < 12 { // Threshold for "similar enough" to consider
                        if best_match.is_none() || dist < best_match.as_ref().unwrap().1 {
                            best_match = Some((sid.clone(), dist));
                            best_card_data = Some((sid, name, set, cn, img));
                        }
                    }
                }
            }
        }
        
        if let Some((_, dist)) = best_match {
            if dist <= 5 { // High confidence match
                best_card_data.map(|(sid, name, set, cn, img)| (sid, name, set, cn, img, dist))
            } else {
                None
            }
        } else {
            None
        }
    };

    if let Some((sid, name, set, cn, img, dist)) = local_match {
        println!("Found local match: {} (dist={})", name, dist);
        
        // Construct a ScryfallCard from local data to return
        let card = crate::models::scryfall::ScryfallCard {
            id: sid,
            oracle_id: None,
            name: name,
            lang: Some("en".to_string()),
            set: set,
            set_name: String::new(), // We don't store set name in cards table, could fetch from sets table
            collector_number: cn,
            released_at: String::new(),
            artist: None,
            image_uris: Some(crate::models::scryfall::ImageUris {
                small: img.clone().unwrap_or_default(),
                normal: img.clone().unwrap_or_default(),
                large: img.clone().unwrap_or_default(),
                png: String::new(),
                art_crop: String::new(),
                border_crop: String::new(),
            }),
            prices: crate::models::scryfall::Prices {
                usd: None, usd_foil: None, eur: None, eur_foil: None
            },
            rarity: String::new(),
            similarity: Some(dist),
        };
        
        return Ok(RecognitionResult {
            features: features.clone(),
            detected_name: String::new(),
            feature_description: describe_features(&features),
            search_query: String::new(),
            candidates: vec![card],
        });
    }

    // Build search query based on features
    let search_query = build_search_query(&features, None);
    let feature_description = describe_features(&features);
    
    // Search Scryfall with the filtered query
    let scryfall_service = services::scryfall::ScryfallService::new();
    let mut candidates = scryfall_service.search_cards(&search_query, 1)
        .await
        .map_err(|e| format!("Scryfall search failed: {}", e))?
        .data;
    
    // --- Image Comparison & Ranking ---
    // Take top 30 candidates to compare (to keep it fast)
    let num_to_compare = 30.min(candidates.len());
    if num_to_compare > 0 {
        use crate::card_features::{calculate_phash, hamming_distance};
        use image::load_from_memory;
        
        // Calculate hash of the user's image
        // We need to reload the image because extract_card_features consumes it or we just re-decode
        // Actually extract_card_features returns features, but we need the image for hashing
        // Let's re-decode for simplicity (it's fast)
        let user_image = image::load_from_memory(&image_bytes)
            .map_err(|e| format!("Failed to load image for hashing: {}", e))?;
        let user_hash = calculate_phash(&user_image);
        
        println!("User Image Hash: {:x}", user_hash);
        
        // We'll process candidates in parallel using futures
        let client = reqwest::Client::new();
        let mut scored_candidates = Vec::new();
        
        for mut card in candidates.drain(..num_to_compare) {
            if let Some(image_uris) = &card.image_uris {
                let thumb_url = image_uris.small.clone();
                let client = client.clone();
                let user_hash = user_hash;
                
                // Download and hash
                // Note: In a real async loop we'd join_all, but for simplicity/borrow checker
                // we'll do it sequentially or use a simple loop. 
                // For 30 small images, sequential is acceptable (~2-3s total) and safer to implement quickly.
                // Parallelizing would require more complex async handling.
                
                match client.get(&thumb_url).send().await {
                    Ok(resp) => {
                        if let Ok(bytes) = resp.bytes().await {
                            if let Ok(img) = load_from_memory(&bytes) {
                                let card_hash = calculate_phash(&img);
                                let dist = hamming_distance(user_hash, card_hash);
                                card.similarity = Some(dist);
                                println!("Compared with {}: dist={}", card.name, dist);
                            }
                        }
                    }
                    Err(e) => println!("Failed to download image for {}: {}", card.name, e),
                }
            }
            scored_candidates.push(card);
        }
        
        // Add back the rest of the candidates (unscored)
        scored_candidates.extend(candidates);
        
        // Sort by similarity (ascending distance)
        // Cards with no similarity (failed download) go to the end
        scored_candidates.sort_by(|a, b| {
            match (a.similarity, b.similarity) {
                (Some(d1), Some(d2)) => d1.cmp(&d2),
                (Some(_), None) => std::cmp::Ordering::Less,
                (None, Some(_)) => std::cmp::Ordering::Greater,
                (None, None) => std::cmp::Ordering::Equal,
            }
        });
        
        candidates = scored_candidates;
    }
    
    Ok(RecognitionResult {
        features,
        detected_name: String::new(), // TODO: Add OCR
        feature_description,
        search_query,
        candidates,
    })
}

mod commands;
mod database;
mod models;
mod services;
mod card_features;
mod card_filter;

use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

/// Application state holding the database connection.
pub struct AppState {
    pub db: Mutex<Connection>,
}

/// Initializes the database path.
///
/// # Arguments
///
/// * `app_handle` - The application handle.
///
/// # Returns
///
/// * `Result<String, String>` - The path to the database or an error message.
#[tauri::command]
fn init_db_command(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let db_path = app_dir.join("mtg_collection.db");

    // Re-initialize or verify connection here if needed, but for now we just return path
    Ok(format!("Database initialized at {:?}", db_path))
}

/// The main entry point for the Tauri application.
/// Sets up the database, state, and registers commands.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
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
            recognize_card_with_features,
            commands::scryfall::import_sets,
            commands::scryfall::get_sets,
            commands::sets::get_set_cards,
            commands::wishlist::add_to_wishlist,
            commands::wishlist::get_wishlist,
            commands::wishlist::remove_from_wishlist,
            commands::wishlist::update_wishlist_card,
            commands::collection::add_card,
            commands::collection::get_card,
            commands::collection::search_scryfall,
            commands::collection::get_card_languages,
            commands::collection::get_collection,
            commands::collection::remove_card,
            commands::collection::update_card_quantity,
            commands::collection::update_prices,
            commands::collection::update_card_details,
            commands::collection::get_portfolio_history,
            commands::collection::get_card_price_history,
            commands::collection::export_collection,
            commands::collection::import_collection,
            commands::collection::calculate_missing_hashes,
            commands::collection::get_collection_sets,
            commands::analytics::get_collection_stats,
            commands::market::get_market_trends,
            commands::tags::create_tag,
            commands::tags::delete_tag,
            commands::tags::get_all_tags,
            commands::tags::add_tag_to_card,
            commands::tags::remove_tag_from_card,
            commands::tags::get_card_tags,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

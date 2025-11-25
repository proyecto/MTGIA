use crate::commands::collection::AddCardArgs;
use crate::models::scryfall::{ScryfallCard, ScryfallSet};
use rusqlite::{params, Connection, Result};

pub fn insert_set(conn: &Connection, set: &ScryfallSet) -> Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO sets (code, name, release_date, icon_uri)
         VALUES (?1, ?2, ?3, ?4)",
        params![
            set.code,
            set.name,
            set.released_at,
            set.icon_svg_uri.clone().unwrap_or_default()
        ],
    )?;
    Ok(())
}

pub fn get_all_sets(conn: &Connection) -> Result<Vec<ScryfallSet>> {
    let mut stmt = conn.prepare(
        "SELECT code, name, release_date, icon_uri
         FROM sets
         ORDER BY release_date DESC",
    )?;

    let set_iter = stmt.query_map([], |row| {
        Ok(ScryfallSet {
            id: String::new(), // Not stored in DB, will be empty
            code: row.get(0)?,
            name: row.get(1)?,
            released_at: row.get(2)?,
            icon_svg_uri: row.get(3)?,
            set_type: None,
            card_count: None,
        })
    })?;

    let mut sets = Vec::new();
    for set in set_iter {
        sets.push(set?);
    }

    Ok(sets)
}

pub fn insert_card(
    conn: &Connection,
    id: &str,
    card: &ScryfallCard,
    args: &AddCardArgs,
    _currency: &str,
) -> Result<()> {
    let image_uri = card
        .image_uris
        .as_ref()
        .map(|u| u.normal.clone())
        .unwrap_or_default();

    conn.execute(
        "INSERT INTO cards (id, scryfall_id, name, set_code, collector_number, condition, purchase_price, current_price, quantity, is_foil, image_uri)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            id,
            args.scryfall_id,
            card.name,
            card.set,
            card.collector_number,
            args.condition,
            args.purchase_price,
            args.purchase_price, // Initially same as purchase price
            args.quantity,
            args.is_foil,
            image_uri
        ],
    )?;
    Ok(())
}

pub fn get_all_cards(conn: &Connection) -> Result<Vec<crate::models::collection::CollectionCard>> {
    let mut stmt = conn.prepare(
        "SELECT id, scryfall_id, name, set_code, collector_number, condition, purchase_price, current_price, quantity, is_foil, image_uri
         FROM cards",
    )?;

    let card_iter = stmt.query_map([], |row| {
        Ok(crate::models::collection::CollectionCard {
            id: row.get(0)?,
            scryfall_id: row.get(1)?,
            name: row.get(2)?,
            set_code: row.get(3)?,
            collector_number: row.get(4)?,
            condition: row.get(5)?,
            purchase_price: row.get(6)?,
            current_price: row.get(7)?,
            quantity: row.get(8)?,
            is_foil: row.get(9)?,
            image_uri: row.get(10)?,
        })
    })?;

    let mut cards = Vec::new();
    for card in card_iter {
        cards.push(card?);
    }

    Ok(cards)
}

pub fn remove_card(conn: &Connection, id: &str) -> Result<()> {
    // First, delete all price history entries for this card
    conn.execute("DELETE FROM price_history WHERE card_id = ?1", params![id])?;
    // Then delete the card itself
    conn.execute("DELETE FROM cards WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn update_card_quantity(conn: &Connection, id: &str, quantity: i32) -> Result<()> {
    conn.execute(
        "UPDATE cards SET quantity = ?1 WHERE id = ?2",
        params![quantity, id],
    )?;
    Ok(())
}

pub fn update_card_price(conn: &Connection, id: &str, price: f64) -> Result<()> {
    conn.execute(
        "UPDATE cards SET current_price = ?1 WHERE id = ?2",
        params![price, id],
    )?;
    Ok(())
}

pub fn insert_price_history(
    conn: &Connection,
    card_id: &str,
    price: f64,
    currency: &str,
) -> Result<()> {
    let date = chrono::Local::now().format("%Y-%m-%d").to_string();

    // Use INSERT OR REPLACE to update if entry already exists for this card+date
    // First, delete any existing entry for this card on this date
    conn.execute(
        "DELETE FROM price_history WHERE card_id = ?1 AND date = ?2",
        params![card_id, date],
    )?;

    // Then insert the new price
    conn.execute(
        "INSERT INTO price_history (card_id, date, price, currency)
         VALUES (?1, ?2, ?3, ?4)",
        params![card_id, date, price, currency],
    )?;
    Ok(())
}

pub fn update_card_details(
    conn: &Connection,
    id: &str,
    condition: &str,
    purchase_price: f64,
) -> Result<()> {
    conn.execute(
        "UPDATE cards SET condition = ?1, purchase_price = ?2 WHERE id = ?3",
        params![condition, purchase_price, id],
    )?;
    Ok(())
}

// ============ Wishlist Operations ============

pub fn add_to_wishlist(
    conn: &Connection,
    card: &ScryfallCard,
    target_price: Option<f64>,
    notes: Option<String>,
    priority: i32,
) -> Result<String> {
    let id = uuid::Uuid::new_v4().to_string();
    let added_date = chrono::Local::now().format("%Y-%m-%d").to_string();
    let image_uri = card
        .image_uris
        .as_ref()
        .map(|u| u.normal.clone())
        .unwrap_or_default();

    conn.execute(
        "INSERT INTO wishlist (id, scryfall_id, name, set_code, collector_number, image_uri, target_price, notes, added_date, priority)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            id,
            card.id,
            card.name,
            card.set,
            card.collector_number,
            image_uri,
            target_price,
            notes,
            added_date,
            priority
        ],
    )?;
    Ok(id)
}

pub fn get_wishlist(conn: &Connection) -> Result<Vec<crate::models::wishlist::WishlistCard>> {
    let mut stmt = conn.prepare(
        "SELECT id, scryfall_id, name, set_code, collector_number, image_uri, target_price, notes, added_date, priority
         FROM wishlist
         ORDER BY priority DESC, added_date DESC",
    )?;

    let wishlist_iter = stmt.query_map([], |row| {
        Ok(crate::models::wishlist::WishlistCard {
            id: row.get(0)?,
            scryfall_id: row.get(1)?,
            name: row.get(2)?,
            set_code: row.get(3)?,
            collector_number: row.get(4)?,
            image_uri: row.get(5)?,
            target_price: row.get(6)?,
            notes: row.get(7)?,
            added_date: row.get(8)?,
            priority: row.get(9)?,
        })
    })?;

    let mut wishlist = Vec::new();
    for card in wishlist_iter {
        wishlist.push(card?);
    }

    Ok(wishlist)
}

pub fn remove_from_wishlist(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM wishlist WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn update_wishlist_card(
    conn: &Connection,
    id: &str,
    target_price: Option<f64>,
    notes: Option<String>,
    priority: i32,
) -> Result<()> {
    conn.execute(
        "UPDATE wishlist SET target_price = ?1, notes = ?2, priority = ?3 WHERE id = ?4",
        params![target_price, notes, priority, id],
    )?;
    Ok(())
}

#[derive(Debug, serde::Serialize)]
pub struct CardPriceHistoryPoint {
    pub date: String,
    pub price: f64,
    pub currency: String,
}

pub fn get_card_price_history(
    conn: &Connection,
    card_id: &str,
) -> Result<Vec<CardPriceHistoryPoint>> {
    let mut stmt = conn.prepare(
        "SELECT date, price, currency
         FROM price_history
         WHERE card_id = ?1
         ORDER BY date ASC",
    )?;

    let history_iter = stmt.query_map([card_id], |row| {
        Ok(CardPriceHistoryPoint {
            date: row.get(0)?,
            price: row.get(1)?,
            currency: row.get(2)?,
        })
    })?;

    let mut history = Vec::new();
    for point in history_iter {
        history.push(point?);
    }

    Ok(history)
}

pub fn get_collection_stats(
    conn: &Connection,
) -> Result<crate::models::analytics::CollectionStats> {
    let cards = get_all_cards(conn)?;

    let mut total_investment = 0.0;
    let mut total_value = 0.0;
    let mut performances = Vec::new();

    for card in cards {
        let investment = card.purchase_price * card.quantity as f64;
        let value = card.current_price * card.quantity as f64;
        let gain = value - investment;

        // Avoid division by zero for ROI
        let roi = if investment > 0.0 {
            (gain / investment) * 100.0
        } else if value > 0.0 {
            100.0 // Infinite ROI technically, but cap at 100% for display or treat as special case
        } else {
            0.0
        };

        total_investment += investment;
        total_value += value;

        performances.push(crate::models::analytics::CardPerformance {
            id: card.id,
            name: card.name,
            set_code: card.set_code,
            quantity: card.quantity,
            purchase_price: card.purchase_price,
            current_price: card.current_price,
            total_gain: gain,
            roi_percentage: roi,
        });
    }

    let total_gain = total_value - total_investment;
    let total_roi = if total_investment > 0.0 {
        (total_gain / total_investment) * 100.0
    } else {
        0.0
    };

    // Sort by gain for winners (descending)
    let mut winners = performances.clone();
    winners.sort_by(|a, b| {
        b.total_gain
            .partial_cmp(&a.total_gain)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    let top_winners = winners.into_iter().take(5).collect();

    // Sort by gain for losers (ascending)
    let mut losers = performances.clone();
    losers.sort_by(|a, b| {
        a.total_gain
            .partial_cmp(&b.total_gain)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    let top_losers = losers.into_iter().take(5).collect();

    Ok(crate::models::analytics::CollectionStats {
        total_investment,
        total_value,
        total_gain,
        total_roi_percentage: total_roi,
        top_winners,
        top_losers,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::schema::create_tables;
    use crate::models::scryfall::{ImageUris, Prices};

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        create_tables(&conn).unwrap();
        conn
    }

    fn create_test_card() -> ScryfallCard {
        ScryfallCard {
            id: "test-id-123".to_string(),
            name: "Test Card".to_string(),
            set: "tst".to_string(),
            set_name: "Test Set".to_string(),
            collector_number: "1".to_string(),
            rarity: "rare".to_string(),
            artist: Some("Test Artist".to_string()),
            released_at: "2024-01-01".to_string(),
            image_uris: Some(ImageUris {
                small: "https://example.com/small.jpg".to_string(),
                normal: "https://example.com/normal.jpg".to_string(),
                large: "https://example.com/large.jpg".to_string(),
                png: "https://example.com/png.png".to_string(),
                art_crop: "https://example.com/art_crop.jpg".to_string(),
                border_crop: "https://example.com/border_crop.jpg".to_string(),
            }),
            prices: Prices {
                usd: Some("10.00".to_string()),
                usd_foil: Some("20.00".to_string()),
                eur: Some("9.00".to_string()),
                eur_foil: Some("18.00".to_string()),
            },
        }
    }

    #[test]
    fn test_add_to_wishlist() {
        let conn = setup_test_db();
        let card = create_test_card();

        let result = add_to_wishlist(&conn, &card, Some(15.0), Some("Test note".to_string()), 2);

        assert!(result.is_ok());
        let id = result.unwrap();
        assert!(!id.is_empty());
    }

    #[test]
    fn test_get_wishlist() {
        let conn = setup_test_db();
        let card = create_test_card();

        add_to_wishlist(&conn, &card, Some(10.0), None, 1).unwrap();

        let wishlist = get_wishlist(&conn).unwrap();

        assert_eq!(wishlist.len(), 1);
        assert_eq!(wishlist[0].name, "Test Card");
        assert_eq!(wishlist[0].priority, 1);
    }

    #[test]
    fn test_remove_from_wishlist() {
        let conn = setup_test_db();
        let card = create_test_card();

        let id = add_to_wishlist(&conn, &card, None, None, 1).unwrap();
        let result = remove_from_wishlist(&conn, &id);

        assert!(result.is_ok());

        let wishlist = get_wishlist(&conn).unwrap();
        assert_eq!(wishlist.len(), 0);
    }

    #[test]
    fn test_update_wishlist_card() {
        let conn = setup_test_db();
        let card = create_test_card();

        let id =
            add_to_wishlist(&conn, &card, Some(10.0), Some("Old note".to_string()), 1).unwrap();

        let result = update_wishlist_card(&conn, &id, Some(20.0), Some("New note".to_string()), 3);
        assert!(result.is_ok());

        let wishlist = get_wishlist(&conn).unwrap();
        assert_eq!(wishlist[0].target_price, Some(20.0));
        assert_eq!(wishlist[0].notes, Some("New note".to_string()));
        assert_eq!(wishlist[0].priority, 3);
    }

    #[test]
    fn test_wishlist_ordering() {
        let conn = setup_test_db();
        let card1 = create_test_card();
        let mut card2 = create_test_card();
        card2.id = "test-id-456".to_string();
        card2.name = "Another Card".to_string();

        // Add cards with different priorities
        add_to_wishlist(&conn, &card1, None, None, 1).unwrap(); // Low priority
        add_to_wishlist(&conn, &card2, None, None, 3).unwrap(); // High priority

        let wishlist = get_wishlist(&conn).unwrap();

        // High priority should come first
        assert_eq!(wishlist.len(), 2);
        assert_eq!(wishlist[0].name, "Another Card");
        assert_eq!(wishlist[0].priority, 3);
        assert_eq!(wishlist[1].name, "Test Card");
        assert_eq!(wishlist[1].priority, 1);
    }

    fn insert_test_set(conn: &Connection) {
        let set = ScryfallSet {
            id: "test-set-id".to_string(),
            code: "tst".to_string(),
            name: "Test Set".to_string(),
            released_at: Some("2024-01-01".to_string()),
            icon_svg_uri: None,
            set_type: None,
            card_count: None,
        };
        insert_set(conn, &set).unwrap();
    }

    #[test]
    fn test_insert_card() {
        let conn = setup_test_db();
        insert_test_set(&conn);
        let card = create_test_card();
        let args = AddCardArgs {
            scryfall_id: card.id.clone(),
            condition: "NM".to_string(),
            purchase_price: 10.0,
            quantity: 1,
            is_foil: false,
        };

        let result = insert_card(&conn, "test-uuid-1", &card, &args, "USD");
        assert!(result.is_ok());

        let cards = get_all_cards(&conn).unwrap();
        assert_eq!(cards.len(), 1);
        assert_eq!(cards[0].name, "Test Card");
        assert_eq!(cards[0].quantity, 1);
    }

    #[test]
    fn test_update_card_quantity() {
        let conn = setup_test_db();
        insert_test_set(&conn);
        let card = create_test_card();
        let args = AddCardArgs {
            scryfall_id: card.id.clone(),
            condition: "NM".to_string(),
            purchase_price: 10.0,
            quantity: 1,
            is_foil: false,
        };

        insert_card(&conn, "test-uuid-1", &card, &args, "USD").unwrap();

        let result = update_card_quantity(&conn, "test-uuid-1", 4);
        assert!(result.is_ok());

        let cards = get_all_cards(&conn).unwrap();
        assert_eq!(cards[0].quantity, 4);
    }

    #[test]
    fn test_remove_card() {
        let conn = setup_test_db();
        insert_test_set(&conn);
        let card = create_test_card();
        let args = AddCardArgs {
            scryfall_id: card.id.clone(),
            condition: "NM".to_string(),
            purchase_price: 10.0,
            quantity: 1,
            is_foil: false,
        };

        insert_card(&conn, "test-uuid-1", &card, &args, "USD").unwrap();

        let result = remove_card(&conn, "test-uuid-1");
        assert!(result.is_ok());

        let cards = get_all_cards(&conn).unwrap();
        assert_eq!(cards.len(), 0);
    }

    #[test]
    fn test_remove_card_with_price_history() {
        let conn = setup_test_db();
        insert_test_set(&conn);
        let card = create_test_card();
        let args = AddCardArgs {
            scryfall_id: card.id.clone(),
            condition: "NM".to_string(),
            purchase_price: 10.0,
            quantity: 1,
            is_foil: false,
        };

        // Insert card
        insert_card(&conn, "test-uuid-1", &card, &args, "USD").unwrap();

        // Add some price history manually to ensure different dates
        conn.execute(
            "INSERT INTO price_history (card_id, date, price, currency) VALUES (?1, ?2, ?3, ?4)",
            params!["test-uuid-1", "2024-01-01", 15.0, "USD"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO price_history (card_id, date, price, currency) VALUES (?1, ?2, ?3, ?4)",
            params!["test-uuid-1", "2024-01-02", 20.0, "USD"],
        )
        .unwrap();

        // Verify price history exists
        let history_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM price_history WHERE card_id = ?1",
                ["test-uuid-1"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(history_count, 2);

        // Remove card
        let result = remove_card(&conn, "test-uuid-1");
        assert!(result.is_ok());

        // Verify card is deleted
        let cards = get_all_cards(&conn).unwrap();
        assert_eq!(cards.len(), 0);

        // Verify price history is also deleted
        let history_count_after: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM price_history WHERE card_id = ?1",
                ["test-uuid-1"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(history_count_after, 0);
    }

    #[test]
    fn test_insert_price_history_prevents_duplicates() {
        let conn = setup_test_db();
        insert_test_set(&conn);
        let card = create_test_card();
        let args = AddCardArgs {
            scryfall_id: card.id.clone(),
            condition: "NM".to_string(),
            purchase_price: 10.0,
            quantity: 1,
            is_foil: false,
        };

        // Insert card
        insert_card(&conn, "test-uuid-1", &card, &args, "USD").unwrap();

        // Insert price history for today
        insert_price_history(&conn, "test-uuid-1", 15.0, "USD").unwrap();

        // Verify one entry exists
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM price_history WHERE card_id = ?1",
                ["test-uuid-1"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);

        // Insert again for the same day (simulating clicking update prices twice)
        insert_price_history(&conn, "test-uuid-1", 20.0, "USD").unwrap();

        // Should still have only one entry (updated, not duplicated)
        let count_after: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM price_history WHERE card_id = ?1",
                ["test-uuid-1"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count_after, 1);

        // Verify the price was updated to the latest value
        let latest_price: f64 = conn
            .query_row(
                "SELECT price FROM price_history WHERE card_id = ?1",
                ["test-uuid-1"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(latest_price, 20.0);
    }

    #[test]
    fn test_update_card_details() {
        let conn = setup_test_db();
        insert_test_set(&conn);
        let card = create_test_card();
        let args = AddCardArgs {
            scryfall_id: card.id.clone(),
            condition: "NM".to_string(),
            purchase_price: 10.0,
            quantity: 1,
            is_foil: false,
        };

        insert_card(&conn, "test-uuid-1", &card, &args, "USD").unwrap();

        let result = update_card_details(&conn, "test-uuid-1", "LP", 15.0);
        assert!(result.is_ok());

        let cards = get_all_cards(&conn).unwrap();
        assert_eq!(cards[0].condition, "LP");
        assert_eq!(cards[0].purchase_price, 15.0);
    }

    #[test]
    fn test_get_card_price_history() {
        let conn = setup_test_db();
        insert_test_set(&conn);
        let card = create_test_card();
        let args = AddCardArgs {
            scryfall_id: card.id.clone(),
            condition: "NM".to_string(),
            purchase_price: 10.0,
            quantity: 1,
            is_foil: false,
        };

        // Insert card
        insert_card(&conn, "test-uuid-1", &card, &args, "USD").unwrap();

        // Add multiple price history entries
        insert_price_history(&conn, "test-uuid-1", 10.0, "USD").unwrap();

        // Manually insert entries with different dates for testing
        conn.execute(
            "INSERT INTO price_history (card_id, date, price, currency) VALUES (?1, ?2, ?3, ?4)",
            params!["test-uuid-1", "2024-01-01", 12.0, "USD"],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO price_history (card_id, date, price, currency) VALUES (?1, ?2, ?3, ?4)",
            params!["test-uuid-1", "2024-01-02", 15.0, "USD"],
        )
        .unwrap();

        // Get price history
        let history = get_card_price_history(&conn, "test-uuid-1").unwrap();

        // Should have 3 entries (today's + 2 manual)
        assert!(history.len() >= 2);

        // Verify ordering (ascending by date)
        assert_eq!(history[0].date, "2024-01-01");
        assert_eq!(history[0].price, 12.0);
        assert_eq!(history[1].date, "2024-01-02");
        assert_eq!(history[1].price, 15.0);
    }

    #[test]
    fn test_get_card_price_history_empty() {
        let conn = setup_test_db();
        insert_test_set(&conn);
        let card = create_test_card();
        let args = AddCardArgs {
            scryfall_id: card.id.clone(),
            condition: "NM".to_string(),
            purchase_price: 10.0,
            quantity: 1,
            is_foil: false,
        };

        // Insert card but no price history
        insert_card(&conn, "test-uuid-1", &card, &args, "USD").unwrap();

        // Get price history
        let history = get_card_price_history(&conn, "test-uuid-1").unwrap();

        // Should be empty
        assert_eq!(history.len(), 0);
    }

    #[test]
    fn test_get_collection_stats() {
        let conn = setup_test_db();
        insert_test_set(&conn);
        let card1 = create_test_card();

        // Card 1: Bought for 10, now 20 (Gain 10, ROI 100%)
        let args1 = AddCardArgs {
            scryfall_id: card1.id.clone(),
            condition: "NM".to_string(),
            purchase_price: 10.0,
            quantity: 1,
            is_foil: false,
        };
        insert_card(&conn, "uuid-1", &card1, &args1, "USD").unwrap();
        update_card_price(&conn, "uuid-1", 20.0).unwrap();

        // Card 2: Bought for 20, now 10 (Loss 10, ROI -50%)
        let mut card2 = create_test_card();
        card2.id = "uuid-2".to_string();
        card2.name = "Loser Card".to_string();
        let args2 = AddCardArgs {
            scryfall_id: card2.id.clone(),
            condition: "NM".to_string(),
            purchase_price: 20.0,
            quantity: 1,
            is_foil: false,
        };
        insert_card(&conn, "uuid-2", &card2, &args2, "USD").unwrap();
        update_card_price(&conn, "uuid-2", 10.0).unwrap();

        let stats = get_collection_stats(&conn).unwrap();

        assert_eq!(stats.total_investment, 30.0);
        assert_eq!(stats.total_value, 30.0);
        assert_eq!(stats.total_gain, 0.0);
        assert_eq!(stats.total_roi_percentage, 0.0);

        assert_eq!(stats.top_winners.len(), 2);
        assert_eq!(stats.top_winners[0].name, "Test Card");
        assert_eq!(stats.top_winners[0].total_gain, 10.0);

        assert_eq!(stats.top_losers.len(), 2);
        assert_eq!(stats.top_losers[0].name, "Loser Card"); // Most negative gain first
        assert_eq!(stats.top_losers[0].total_gain, -10.0);
    }
}

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
}

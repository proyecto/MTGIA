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
    currency: &str,
) -> Result<()> {
    let image_uri = card
        .image_uris
        .as_ref()
        .map(|u| u.normal.clone())
        .unwrap_or_default();

    let current_price = if currency == "EUR" {
        // Try EUR price, fallback to USD if missing
        let price_str = if args.is_foil {
            &card.prices.eur_foil
        } else {
            &card.prices.eur
        };
        price_str
            .as_ref()
            .or(if args.is_foil {
                card.prices.usd_foil.as_ref()
            } else {
                card.prices.usd.as_ref()
            })
            .and_then(|p| p.parse::<f64>().ok())
            .unwrap_or(0.0)
    } else {
        // Default to USD
        let price_str = if args.is_foil {
            &card.prices.usd_foil
        } else {
            &card.prices.usd
        };
        price_str
            .as_ref()
            .and_then(|p| p.parse::<f64>().ok())
            .unwrap_or(0.0)
    };

    conn.execute(
        "INSERT INTO cards (
            id, scryfall_id, name, set_code, collector_number, 
            condition, purchase_price, current_price, quantity, is_foil, image_uri
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            id,
            card.id,
            card.name,
            card.set,
            card.collector_number,
            args.condition,
            args.purchase_price,
            current_price,
            args.quantity,
            args.is_foil,
            image_uri
        ],
    )?;
    Ok(())
}

pub fn get_all_cards(conn: &Connection) -> Result<Vec<crate::models::collection::CollectionCard>> {
    let mut stmt = conn.prepare(
        "SELECT id, scryfall_id, name, set_code, collector_number, 
                condition, purchase_price, current_price, quantity, is_foil, image_uri
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

pub fn update_card_price(conn: &Connection, id: &str, current_price: f64) -> Result<()> {
    conn.execute(
        "UPDATE cards SET current_price = ?1 WHERE id = ?2",
        params![current_price, id],
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
        "INSERT INTO price_history (card_id, date, price, currency) VALUES (?1, ?2, ?3, ?4)",
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

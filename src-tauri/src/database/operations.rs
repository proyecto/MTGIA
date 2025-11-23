use rusqlite::{Connection, Result, params};
use crate::models::scryfall::{ScryfallSet, ScryfallCard};
use crate::commands::collection::AddCardArgs;

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

pub fn insert_card(conn: &Connection, id: &str, card: &ScryfallCard, args: &AddCardArgs, currency: &str) -> Result<()> {
    let image_uri = card.image_uris.as_ref().map(|u| u.normal.clone()).unwrap_or_default();
    
    let current_price = if currency == "EUR" {
        // Try EUR price, fallback to USD if missing
        let price_str = if args.is_foil { &card.prices.eur_foil } else { &card.prices.eur };
        price_str.as_ref()
            .or(if args.is_foil { card.prices.usd_foil.as_ref() } else { card.prices.usd.as_ref() })
            .and_then(|p| p.parse::<f64>().ok())
            .unwrap_or(0.0)
    } else {
        // Default to USD
        let price_str = if args.is_foil { &card.prices.usd_foil } else { &card.prices.usd };
        price_str.as_ref().and_then(|p| p.parse::<f64>().ok()).unwrap_or(0.0)
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
         FROM cards"
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

pub fn insert_price_history(conn: &Connection, card_id: &str, price: f64, currency: &str) -> Result<()> {
    let date = chrono::Local::now().format("%Y-%m-%d").to_string();
    conn.execute(
        "INSERT INTO price_history (card_id, date, price, currency) VALUES (?1, ?2, ?3, ?4)",
        params![card_id, date, price, currency],
    )?;
    Ok(())
}

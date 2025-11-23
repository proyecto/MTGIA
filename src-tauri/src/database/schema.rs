use rusqlite::{Connection, Result};

pub fn create_tables(conn: &Connection) -> Result<()> {
    // Sets table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sets (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            release_date TEXT,
            icon_uri TEXT
        )",
        [],
    )?;

    // Cards table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY,
            scryfall_id TEXT NOT NULL,
            name TEXT NOT NULL,
            set_code TEXT NOT NULL,
            collector_number TEXT NOT NULL,
            condition TEXT DEFAULT 'NM',
            purchase_price REAL,
            current_price REAL,
            quantity INTEGER DEFAULT 1,
            is_foil BOOLEAN DEFAULT 0,
            image_uri TEXT,
            FOREIGN KEY(set_code) REFERENCES sets(code)
        )",
        [],
    )?;

    // Price History table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_id TEXT NOT NULL,
            date TEXT NOT NULL,
            price REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            FOREIGN KEY(card_id) REFERENCES cards(id)
        )",
        [],
    )?;

    // Wishlist table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS wishlist (
            id TEXT PRIMARY KEY,
            scryfall_id TEXT NOT NULL,
            name TEXT NOT NULL,
            set_code TEXT NOT NULL,
            collector_number TEXT NOT NULL,
            image_uri TEXT,
            target_price REAL,
            notes TEXT,
            added_date TEXT NOT NULL,
            priority INTEGER DEFAULT 1
        )",
        [],
    )?;

    Ok(())
}

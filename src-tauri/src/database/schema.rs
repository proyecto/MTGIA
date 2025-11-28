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
            language TEXT DEFAULT 'English',
            finish TEXT DEFAULT 'nonfoil',
            phash TEXT,
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

    // Tags table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            color TEXT DEFAULT '#3B82F6'
        )",
        [],
    )?;

    // Card Tags junction table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS card_tags (
            card_id TEXT NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY (card_id, tag_id),
            FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE,
            FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )",
        [],
    )?;

    Ok(())
}

pub fn migrate_database(conn: &Connection) -> Result<()> {
    // Check if language column exists, if not add it
    let column_exists: Result<i32> = conn.query_row(
        "SELECT COUNT(*) FROM pragma_table_info('cards') WHERE name='language'",
        [],
        |row| row.get(0),
    );

    match column_exists {
        Ok(0) => {
            // Column doesn't exist, add it
            conn.execute(
                "ALTER TABLE cards ADD COLUMN language TEXT DEFAULT 'English'",
                [],
            )?;
            println!("Migration: Added 'language' column to cards table");
        }
        Ok(_) => {
            // Column already exists
            println!("Migration: 'language' column already exists");
        }
        Err(e) => {
            println!("Migration check failed: {}", e);
        }
    }

    // Check if finish column exists, if not add it
    let finish_column_exists: Result<i32> = conn.query_row(
        "SELECT COUNT(*) FROM pragma_table_info('cards') WHERE name='finish'",
        [],
        |row| row.get(0),
    );

    match finish_column_exists {
        Ok(0) => {
            // Column doesn't exist, add it
            conn.execute(
                "ALTER TABLE cards ADD COLUMN finish TEXT DEFAULT 'nonfoil'",
                [],
            )?;
            // Update existing foil cards to have 'foil' finish
            conn.execute("UPDATE cards SET finish = 'foil' WHERE is_foil = 1", [])?;
            println!("Migration: Added 'finish' column to cards table and migrated foil cards");
        }
        Ok(_) => {
            // Column already exists
            println!("Migration: 'finish' column already exists");
        }
        Err(e) => {
            println!("Migration check for finish failed: {}", e);
        }
    }

    // Check if phash column exists, if not add it
    let phash_column_exists: Result<i32> = conn.query_row(
        "SELECT COUNT(*) FROM pragma_table_info('cards') WHERE name='phash'",
        [],
        |row| row.get(0),
    );

    match phash_column_exists {
        Ok(0) => {
            // Column doesn't exist, add it
            // We store phash as TEXT (hex string) to avoid signed/unsigned issues with SQLite INTEGER
            conn.execute(
                "ALTER TABLE cards ADD COLUMN phash TEXT",
                [],
            )?;
            println!("Migration: Added 'phash' column to cards table");
        }
        Ok(_) => {
            // Column already exists
            println!("Migration: 'phash' column already exists");
        }
        Err(e) => {
            println!("Migration check for phash failed: {}", e);
        }
    }

    Ok(())
}

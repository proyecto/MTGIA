use crate::database::schema::{create_tables, migrate_database};
use rusqlite::{Connection, Result};
use std::fs;
use std::path::Path;

pub fn init_db<P: AsRef<Path>>(path: P) -> Result<Connection> {
    // Ensure directory exists
    if let Some(parent) = path.as_ref().parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).expect("Failed to create database directory");
        }
    }

    let conn = Connection::open(path)?;

    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;", [])?;

    // Create tables
    create_tables(&conn)?;

    // Run migrations for existing databases
    migrate_database(&conn)?;

    Ok(conn)
}

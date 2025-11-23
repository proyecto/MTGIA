use rusqlite::{Connection, Result};
use std::path::Path;
use std::fs;
use crate::database::schema::create_tables;

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
    
    Ok(conn)
}

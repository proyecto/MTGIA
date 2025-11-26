# Backend Documentation

The backend of the MTG Collection Manager is built with **Rust** and **Tauri**. It handles data persistence (SQLite), API interactions (Scryfall), and business logic.

## Key Modules

- **[Commands](./commands.md)**: Tauri commands exposed to the frontend.
- **[Database](./database.md)**: SQLite database schema and operations.
- **[Services](./services.md)**: External services integration (Scryfall).
- **Models**: Data structures shared between backend and frontend (via serialization).

## Architecture

The application follows a modular architecture:

1.  **`lib.rs`**: The entry point. Initializes the database, sets up the application state, and registers commands.
2.  **`commands/`**: Contains the command handlers. Each module (e.g., `collection`, `sets`) groups related commands.
3.  **`database/`**: Handles all database interactions using `rusqlite`.
4.  **`services/`**: Encapsulates logic for external APIs.
5.  **`models/`**: Defines Rust structs that mirror database tables or API responses.

## State Management

The application state (`AppState`) is managed by Tauri and holds a `Mutex<Connection>` to the SQLite database, ensuring thread-safe access.

# Database Documentation

The application uses **SQLite** for local data persistence. The database file is stored in the user's app data directory as `mtg_collection.db`.

## Schema

### `cards` Table
Stores the user's collection.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT | Unique UUID for the card instance. |
| `scryfall_id` | TEXT | ID of the card in Scryfall. |
| `name` | TEXT | Card name. |
| `set_code` | TEXT | Set code (e.g., "dom"). |
| `collector_number` | TEXT | Collector number. |
| `condition` | TEXT | Condition (NM, LP, etc.). |
| `purchase_price` | REAL | Price paid. |
| `current_price` | REAL | Current market price. |
| `quantity` | INTEGER | Number of copies. |
| `is_foil` | BOOLEAN | Foil status. |
| `image_uri` | TEXT | URL to the card image. |
| `language` | TEXT | Card language. |
| `finish` | TEXT | Card finish (foil, nonfoil, etched, etc.). |

### `sets` Table
Stores cached set information.

| Column | Type | Description |
| :--- | :--- | :--- |
| `code` | TEXT | Set code (Primary Key). |
| `name` | TEXT | Set name. |
| `release_date` | TEXT | Release date. |
| `icon_uri` | TEXT | URL to the set icon. |

### `price_history` Table
Stores historical price data for cards.

| Column | Type | Description |
| :--- | :--- | :--- |
| `card_id` | TEXT | UUID of the card (Foreign Key). |
| `date` | TEXT | Date of the price record (YYYY-MM-DD). |
| `price` | REAL | Recorded price. |
| `currency` | TEXT | Currency code. |

### `wishlist` Table
Stores cards the user wants to acquire.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT | Unique UUID. |
| `scryfall_id` | TEXT | Scryfall ID. |
| `name` | TEXT | Card name. |
| `set_code` | TEXT | Set code. |
| `collector_number` | TEXT | Collector number. |
| `image_uri` | TEXT | Image URL. |
| `target_price` | REAL | Desired price. |
| `notes` | TEXT | User notes. |
| `added_date` | TEXT | Date added. |
| `priority` | INTEGER | Priority level (1-3). |

## Operations (`src-tauri/src/database/operations.rs`)

Key functions for interacting with the database:

- `insert_card`: Adds a new card.
- `get_all_cards`: Retrieves the entire collection.
- `update_card_quantity`: Updates quantity.
- `update_card_price`: Updates current price.
- `insert_price_history`: Records a price point.
- `get_collection_stats`: Calculates total value, ROI, etc.

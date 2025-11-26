# Commands Documentation

Tauri commands are the bridge between the frontend and backend. They are asynchronous Rust functions annotated with `#[tauri::command]`.

## Collection Commands (`src-tauri/src/commands/collection.rs`)

- **`add_card`**: Adds a card to the collection.
- **`get_collection`**: Retrieves all cards.
- **`remove_card`**: Deletes a card.
- **`update_card_quantity`**: Changes the quantity of a card.
- **`update_card_details`**: Updates condition, language, or purchase price.
- **`update_prices`**: Bulk updates prices for all cards.
- **`get_portfolio_history`**: Returns total collection value over time.
- **`get_card_price_history`**: Returns price history for a specific card.
- **`export_collection`**: Returns collection as CSV string.
- **`import_collection`**: Imports cards from CSV string.
- **`search_scryfall`**: Proxies a search request to Scryfall.
- **`get_card_languages`**: Fetches available languages for a card.

## Set Commands (`src-tauri/src/commands/sets.rs`)

- **`get_set_cards`**: Fetches cards for a specific set.

## Scryfall Commands (`src-tauri/src/commands/scryfall.rs`)

- **`import_sets`**: Fetches all sets from Scryfall and caches them locally. Emits progress events.
- **`get_sets`**: Retrieves cached sets.

## Wishlist Commands (`src-tauri/src/commands/wishlist.rs`)

- **`add_to_wishlist`**: Adds a card to the wishlist.
- **`get_wishlist`**: Retrieves wishlist items.
- **`remove_from_wishlist`**: Removes an item.
- **`update_wishlist_card`**: Updates target price, notes, or priority.

## Analytics Commands (`src-tauri/src/commands/analytics.rs`)

- **`get_collection_stats`**: Returns summary statistics (total value, ROI, top winners/losers).

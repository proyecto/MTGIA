# Services Documentation

## Scryfall Service (`src-tauri/src/services/scryfall.rs`)

The `ScryfallService` struct handles all interactions with the Scryfall API. It uses `reqwest` for HTTP requests.

### Key Methods

- **`new()`**: Initializes the service with a custom user agent.
- **`fetch_sets()`**: Retrieves all Magic: The Gathering sets.
- **`fetch_card(id)`**: Fetches a single card by its Scryfall ID.
- **`search_cards(query, page)`**: Executes a search query using Scryfall syntax.
- **`fetch_cards_by_set(set_code, page)`**: Retrieves cards from a specific set.
- **`get_card_languages(oracle_id, set_code)`**: Fetches all available languages for a specific card printing.

### Error Handling

The service handles network errors and API errors (like 404 Not Found). It returns `Result` types that are propagated up to the command layer.

## Price Service (`src-tauri/src/services/prices.rs`)

(Assuming existence based on `update_prices` command)
Handles fetching current prices for cards, potentially supporting multiple currencies.

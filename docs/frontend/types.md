# Types Documentation (`src/types.ts`)

Defines the core data structures used in the frontend. These often mirror the backend structs.

## Key Interfaces

### `ScryfallCard`
Represents a card object from the Scryfall API.
- `id`: Scryfall UUID.
- `name`: Card name.
- `set`: Set code.
- `image_uris`: Object containing URLs for different image sizes.
- `prices`: Object containing price data.

### `CollectionCard`
Extends `ScryfallCard` (or similar structure) with collection-specific data.
- `quantity`: Number of copies owned.
- `condition`: Physical condition.
- `purchase_price`: Cost basis.
- `is_foil`: Foil status.
- `language`: Card language.

### `WishlistCard`
Represents an item in the wishlist.
- `target_price`: Desired acquisition price.
- `priority`: Urgency level.

### `Set`
Represents a Magic: The Gathering set.
- `code`: Set code.
- `name`: Set name.
- `icon_svg_uri`: URL to set symbol.

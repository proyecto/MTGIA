# Custom Tags

The Custom Tags feature allows users to organize their collection by creating and assigning custom tags to cards.

## Features

- **Create Tags**: Users can create new tags with a name and a custom color.
- **Manage Tags**: Users can view all existing tags and delete them.
- **Assign Tags**: Tags can be assigned to individual cards in the collection.
- **Filter by Tags**: The collection view supports filtering cards by a specific tag.
- **Visual Indicators**: Cards in the collection grid display their assigned tags as colored badges.

## Technical Implementation

### Database
- **`tags` table**: Stores tag definitions (`id`, `name`, `color`).
- **`card_tags` table**: Join table linking cards to tags (`card_id`, `tag_id`).

### Backend (Rust)
- **Models**: `Tag` struct defined in `src-tauri/src/models/tags.rs`.
- **Operations**: Database operations in `src-tauri/src/database/operations.rs`:
    - `create_tag`
    - `delete_tag`
    - `get_all_tags`
    - `add_tag_to_card`
    - `remove_tag_from_card`
    - `get_card_tags`
- **Commands**: Tauri commands exposed in `src-tauri/src/commands/tags.rs`.

### Frontend (React)
- **`TagManager.tsx`**: Component for creating and deleting tags.
- **`TagSelector.tsx`**: Component for assigning/removing tags from a card.
- **`Collection.tsx`**: Updated to fetch tags and support filtering.
- **`CardItem.tsx`**: Updated to display tags.

## Usage

1.  **Open Card Details**: Click on a card in the collection.
2.  **Manage Tags**: Click the "+" icon or "Manage Tags" button.
3.  **Create Tag**: Enter a name, pick a color, and click "Create Tag".
4.  **Assign Tag**: Select the tag from the dropdown to assign it to the card.
5.  **Filter**: On the Collection page, use the "All Tags" dropdown to filter by a specific tag.

# Components Documentation

## Core Components

### `Layout.tsx`
The main layout wrapper containing the sidebar and the main content area. It handles navigation and window controls (if custom).

### `Sidebar.tsx`
Navigation menu. Links to Dashboard, Collection, Wishlist, etc.

### `SearchModal.tsx`
A complex component that handles:
- Searching for cards via Scryfall.
- Displaying search results.
- Selecting card details (condition, language, foil).
- Adding cards to the collection.

### `CardDetailsModal.tsx`
Displays detailed information about a specific card in the collection. Allows editing details (condition, price) and viewing price history.

### `CardItem.tsx`
A reusable component for rendering a single card's image and basic info in a grid or list.

### `StatisticsModal.tsx`
Displays charts and statistics about the collection (e.g., value over time, mana curve).

### `ProfitabilityReport.tsx`
A dedicated view for analyzing collection performance (ROI, top gainers/losers).

## UI Elements

- **`Button.tsx`**: Standardized button component.
- **`Input.tsx`**: Standardized text input.
- **`Select.tsx`**: Standardized dropdown.

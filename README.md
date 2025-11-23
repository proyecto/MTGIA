# MTG Collection Manager

A powerful, modern desktop application for managing your Magic: The Gathering card collection. Built with Tauri, Rust, and React.

## 🚀 Features

- **Collection Management**: Easily add cards to your collection, track quantities, conditions (Mint, Near Mint, etc.), and foil status.
- **Portfolio Tracking**: Monitor the total value of your collection with real-time pricing data.
- **Wishlist**: Keep track of cards you want to acquire. Set target prices, priorities, and add notes.
- **Set Browser**: Explore all Magic: The Gathering sets and view cards within them.
- **Scryfall Integration**: Powered by the Scryfall API for comprehensive and up-to-date card data and pricing.
- **Data Persistence**: Your collection is safely stored in a local SQLite database.

## 📥 Download

**macOS (Apple Silicon)**: [Download Installer](https://github.com/proyecto/MTGIA/raw/refs/heads/main/release/latest/MTG%20Collection%20Manager_0.1.0_aarch64.dmg)

> Note: The DMG file is located in the `release/dmg` directory of this repository.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Rust, Tauri
- **Database**: SQLite
- **Testing**: Vitest (Frontend), Cargo Test (Backend)

## 👨‍💻 Development

### Prerequisites

- Node.js
- Rust & Cargo
- Tauri prerequisites for your OS

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

### Testing

- **Frontend**: `npm test`
- **Backend**: `cd src-tauri && cargo test`

## 📄 License

This project is open source.

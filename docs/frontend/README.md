# Frontend Documentation

The frontend is a **React** application built with **TypeScript** and **Vite**. It uses **Tailwind CSS** for styling and communicates with the Tauri backend via the `@tauri-apps/api`.

## Key Directories

- **`src/components/`**: Reusable UI components.
- **`src/pages/`**: Top-level page components.
- **`src/contexts/`**: React Context providers (e.g., Settings).
- **`src/types.ts`**: TypeScript interfaces and types.

## Architecture

The application uses a standard React component tree. State is managed primarily through local component state and React Context for global settings. Data fetching is done via Tauri commands, often triggered by `useEffect` hooks or user interactions.

## Styling

Styling is handled by Tailwind CSS. The design system emphasizes a clean, modern aesthetic with support for dark mode (though currently optimized for a specific theme).

# Soporte de Idiomas para Cartas

## Descripción
Se ha implementado soporte completo para rastrear el idioma de cada carta en la colección.

## Cambios Realizados

### Backend (Rust)

1. **Modelo de Datos** (`src-tauri/src/models/collection.rs`)
   - Añadido campo `language: String` a `CollectionCard`

2. **Esquema de Base de Datos** (`src-tauri/src/database/schema.rs`)
   - Añadida columna `language TEXT DEFAULT 'English'` a la tabla `cards`

3. **Operaciones de Base de Datos** (`src-tauri/src/database/operations.rs`)
   - Actualizado `insert_card` para incluir el idioma
   - Actualizado `get_all_cards` para recuperar el idioma
   - Actualizado `update_card_details` para permitir editar el idioma

4. **Comandos Tauri** (`src-tauri/src/commands/collection.rs`)
   - Añadido campo `language` a `AddCardArgs`
   - Actualizado `update_card_details` para aceptar el parámetro `language`

### Frontend (React/TypeScript)

1. **Tipos** (`src/types.ts`)
   - Añadido `language: string` a `CollectionCard`
   - Añadido `language: string` a `AddCardArgs`

2. **SearchModal** (`src/components/SearchModal.tsx`)
   - Añadido selector de idioma con 11 opciones
   - Incluye: English, Spanish, Japanese, German, French, Italian, Portuguese, Russian, Korean, Chinese Simplified, Chinese Traditional

3. **CardDetailsModal** (`src/components/CardDetailsModal.tsx`)
   - Añadido selector de idioma en modo "Add to Collection"
   - Añadido selector de idioma editable en modo "View" (para cartas existentes)

4. **EditCardModal** (`src/components/EditCardModal.tsx`)
   - Añadido selector de idioma para editar cartas existentes

### Tests

1. **Backend Tests** (`src-tauri/src/database/operations.rs`)
   - Todos los tests actualizados para incluir `language: "English".to_string()`
   - Test de `update_card_details` actualizado para verificar cambio de idioma a "Japanese"

2. **Frontend Tests** (`src/components/__tests__/EditCardModal.test.tsx`)
   - Actualizado mockCard para incluir campo `language`
   - Corregido test para manejar múltiples comboboxes (condition y language)

## Idiomas Soportados

1. English (por defecto)
2. Spanish
3. Japanese
4. German
5. French
6. Italian
7. Portuguese
8. Russian
9. Korean
10. Chinese Simplified
11. Chinese Traditional

## Uso

### Al añadir una carta nueva:
1. Buscar la carta en SearchModal o CardDetailsModal
2. Seleccionar el idioma del desplegable (por defecto: English)
3. Completar los demás campos (condición, cantidad, precio, foil)
4. Añadir a la colección

### Al editar una carta existente:
1. Abrir la carta desde la colección
2. Cambiar el idioma en el selector
3. Guardar los cambios

## Migración de Datos

Las cartas existentes en la base de datos se configurarán automáticamente con idioma "English" gracias al valor por defecto en el esquema de la base de datos.

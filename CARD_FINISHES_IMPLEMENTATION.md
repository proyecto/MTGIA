# Implementación de Variantes Específicas de Cartas

## Objetivo
Añadir soporte para rastrear diferentes acabados/variantes de cartas Magic: The Gathering más allá del simple "foil/no-foil".

## Tipos de Acabados Soportados

### Acabados Principales
1. **nonfoil** - Carta normal sin tratamiento especial
2. **foil** - Foil tradicional
3. **etched** - Foil grabado (etched foil)
4. **glossy** - Acabado brillante

### Variantes Especiales
5. **showcase** - Versión showcase
6. **extended_art** - Arte extendido
7. **borderless** - Sin borde
8. **full_art** - Arte completo

### Promocionales
9. **promo** - Carta promocional genérica
10. **prerelease** - Promo de pre-lanzamiento
11. **buy_a_box** - Promo de Buy-a-Box
12. **fnm** - Friday Night Magic promo

### Otros
13. **serialized** - Carta serializada/numerada
14. **gilded** - Acabado dorado (gilded foil)
15. **textured** - Acabado texturizado

## Cambios en la Base de Datos

### Modelo de Datos (Rust)
```rust
pub struct CollectionCard {
    // ... campos existentes ...
    pub is_foil: bool,      // Mantener para retrocompatibilidad
    pub finish: String,     // NUEVO: tipo de acabado específico
}
```

### Esquema de Base de Datos
```sql
ALTER TABLE cards ADD COLUMN finish TEXT DEFAULT 'nonfoil';
```

### Migración Automática
- Cartas existentes con `is_foil = 0` → `finish = 'nonfoil'`
- Cartas existentes con `is_foil = 1` → `finish = 'foil'`
- Nuevas cartas pueden tener cualquier acabado

## Cambios en el Frontend

### Selector de Acabado
Reemplazar el checkbox "Foil" con un selector desplegable:

```tsx
<select value={finish} onChange={(e) => setFinish(e.target.value)}>
  <optgroup label="Standard">
    <option value="nonfoil">Non-foil</option>
    <option value="foil">Foil</option>
    <option value="etched">Etched Foil</option>
  </optgroup>
  <optgroup label="Special Variants">
    <option value="showcase">Showcase</option>
    <option value="extended_art">Extended Art</option>
    <option value="borderless">Borderless</option>
    <option value="full_art">Full Art</option>
  </optgroup>
  <optgroup label="Promotional">
    <option value="promo">Promo</option>
    <option value="prerelease">Prerelease</option>
    <option value="buy_a_box">Buy-a-Box</option>
    <option value="fnm">FNM Promo</option>
  </optgroup>
  <optgroup label="Premium">
    <option value="serialized">Serialized</option>
    <option value="gilded">Gilded Foil</option>
    <option value="textured">Textured Foil</option>
  </optgroup>
</select>
```

### Indicadores Visuales
- **Foil tradicional**: ⭐ (estrella dorada)
- **Etched**: ✨ (brillos)
- **Showcase**: 🎨 (paleta)
- **Extended Art**: 🖼️ (marco)
- **Borderless**: 🔲 (cuadrado sin borde)
- **Promo**: 🎁 (regalo)
- **Serialized**: 🔢 (números)

## Archivos a Modificar

### Backend
- [x] `src-tauri/src/models/collection.rs` - Añadir campo `finish`
- [x] `src-tauri/src/database/schema.rs` - Añadir columna y migración
- [ ] `src-tauri/src/database/operations.rs` - Actualizar INSERT/SELECT
- [ ] `src-tauri/src/commands/collection.rs` - Actualizar AddCardArgs

### Frontend
- [ ] `src/types.ts` - Añadir campo `finish`
- [ ] `src/components/SearchModal.tsx` - Selector de acabado
- [ ] `src/components/CardDetailsModal.tsx` - Selector de acabado
- [ ] `src/components/EditCardModal.tsx` - Selector de acabado
- [ ] `src/components/CardItem.tsx` - Indicador visual de acabado

### Tests
- [ ] Actualizar tests de backend
- [ ] Actualizar tests de frontend
- [ ] Añadir tests para migración

### Exportación/Importación
- [ ] Actualizar CSV export para incluir `finish`
- [ ] Actualizar CSV import para leer `finish`
- [ ] Retrocompatibilidad con CSVs antiguos

## Retrocompatibilidad

### Campo `is_foil`
- Se mantiene el campo `is_foil` por retrocompatibilidad
- Se actualiza automáticamente basado en `finish`:
  - `finish` contiene "foil" → `is_foil = true`
  - `finish = "nonfoil"` → `is_foil = false`

### CSVs Antiguos
- CSVs sin columna `finish` → se asigna basado en `is_foil`
- CSVs con columna `finish` → se usa el valor especificado

## Beneficios

1. **Mayor Precisión**: Rastrear exactamente qué versión de la carta tienes
2. **Valoración Correcta**: Diferentes acabados tienen diferentes precios
3. **Colección Completa**: Saber qué variantes te faltan
4. **Filtrado Avanzado**: Buscar por tipo de acabado específico
5. **Estadísticas**: Ver distribución de acabados en tu colección

## Próximos Pasos

1. ✅ Actualizar modelo de datos
2. ✅ Actualizar esquema de base de datos
3. ✅ Implementar migración automática
4. ⏳ Actualizar operaciones de base de datos
5. ⏳ Actualizar comandos Tauri
6. ⏳ Actualizar componentes frontend
7. ⏳ Actualizar tests
8. ⏳ Actualizar exportación/importación
9. ⏳ Documentar cambios

## Notas Técnicas

- El campo `finish` es un String para flexibilidad futura
- Se podría convertir a enum en el futuro si se desea validación estricta
- La migración es no destructiva - mantiene todos los datos existentes
- Compatible con la API de Scryfall que proporciona información de acabados

# Solución al Problema: No se Añaden Cartas a la Colección

## Problema Identificado

Cuando se intentaba añadir cartas a la colección después de implementar el soporte de idiomas, la aplicación fallaba porque:

1. **Bases de datos existentes** no tenían la columna `language` en la tabla `cards`
2. El código intentaba insertar datos en una columna que no existía
3. SQLite rechazaba la operación con un error

## Causa Raíz

El comando `CREATE TABLE IF NOT EXISTS` solo crea la tabla si no existe, pero **no añade columnas nuevas** a tablas existentes. Por lo tanto, las bases de datos creadas antes de la implementación del soporte de idiomas no tenían la columna `language`.

## Solución Implementada

### 1. Función de Migración Automática

Se añadió una función `migrate_database()` en `src-tauri/src/database/schema.rs` que:

```rust
pub fn migrate_database(conn: &Connection) -> Result<()> {
    // Verifica si la columna 'language' existe
    let column_exists: Result<i32> = conn.query_row(
        "SELECT COUNT(*) FROM pragma_table_info('cards') WHERE name='language'",
        [],
        |row| row.get(0),
    );

    match column_exists {
        Ok(0) => {
            // La columna no existe, la añade
            conn.execute(
                "ALTER TABLE cards ADD COLUMN language TEXT DEFAULT 'English'",
                [],
            )?;
            println!("Migration: Added 'language' column to cards table");
        }
        Ok(_) => {
            // La columna ya existe
            println!("Migration: 'language' column already exists");
        }
        Err(e) => {
            println!("Migration check failed: {}", e);
        }
    }

    Ok(())
}
```

### 2. Integración en la Inicialización

Se modificó `src-tauri/src/database/connection.rs` para llamar a `migrate_database()` después de `create_tables()`:

```rust
pub fn init_db<P: AsRef<Path>>(path: P) -> Result<Connection> {
    // ... código existente ...
    
    // Create tables
    create_tables(&conn)?;
    
    // Run migrations for existing databases
    migrate_database(&conn)?;
    
    Ok(conn)
}
```

## Resultado

- ✅ Las bases de datos nuevas se crean con la columna `language` desde el principio
- ✅ Las bases de datos existentes se migran automáticamente al iniciar la aplicación
- ✅ Todas las cartas existentes reciben el valor por defecto "English"
- ✅ Las nuevas cartas se pueden añadir con cualquier idioma seleccionado

## Cómo Verificar

1. Cierra la aplicación si está abierta
2. Ejecuta `npm run tauri dev`
3. En la consola deberías ver uno de estos mensajes:
   - `Migration: Added 'language' column to cards table` (si tenías una base de datos existente)
   - `Migration: 'language' column already exists` (si la columna ya existía)
4. Intenta añadir una carta nueva - ahora debería funcionar correctamente

## Migración Manual (Opcional)

Si prefieres migrar manualmente la base de datos, puedes usar el archivo `migration_add_language.sql`:

```bash
sqlite3 /ruta/a/tu/base/de/datos.db < migration_add_language.sql
```

## Archivos Modificados

- `src-tauri/src/database/schema.rs` - Añadida función `migrate_database()`
- `src-tauri/src/database/connection.rs` - Integrada llamada a migración
- `migration_add_language.sql` - Script SQL manual (opcional)

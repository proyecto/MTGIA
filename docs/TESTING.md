# Testing Guide

## Frontend Tests (Vitest)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Tests are located in `__tests__` directories next to the code they test.

Example:
- `src/pages/Wishlist.tsx` → `src/pages/__tests__/Wishlist.test.tsx`

### Test Structure

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component Name', () => {
  it('should do something', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Backend Tests (Rust)

### Running Tests

```bash
cd src-tauri
cargo test
```

### Running Specific Tests

```bash
cargo test test_name
cargo test --package tauri-app --lib database::operations::tests
```

### Test Structure

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_something() {
        // Arrange
        // Act
        // Assert
    }
}
```

## Best Practices

1. **Test Naming**: Use descriptive names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock External Dependencies**: Use mocks for Tauri invoke, API calls, etc.
4. **Test Edge Cases**: Include tests for error conditions
5. **Keep Tests Fast**: Use in-memory databases for backend tests

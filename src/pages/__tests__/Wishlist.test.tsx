import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Wishlist from '../Wishlist';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

describe('Wishlist Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders wishlist header', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockResolvedValue([]);

        render(<Wishlist />);

        await waitFor(() => {
            expect(screen.getByText('Wishlist')).toBeInTheDocument();
        });
    });

    it('displays empty state when no cards', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockResolvedValue([]);

        render(<Wishlist />);

        await waitFor(() => {
            expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
        });
    });

    it('displays cards when wishlist has items', async () => {
        const mockCards = [
            {
                id: '1',
                scryfall_id: 'abc123',
                name: 'Black Lotus',
                set_code: 'lea',
                collector_number: '232',
                image_uri: 'https://example.com/image.jpg',
                priority: 3,
                added_date: '2024-01-01',
            },
        ];

        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockResolvedValue(mockCards);

        render(<Wishlist />);

        await waitFor(() => {
            expect(screen.getByText('Black Lotus')).toBeInTheDocument();
        });
    });

    it('displays add card button', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockResolvedValue([]);

        render(<Wishlist />);

        await waitFor(() => {
            expect(screen.getByText('+ Add Card')).toBeInTheDocument();
        });
    });

    it('shows loading state initially', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation(() => new Promise(() => { })); // Never resolves

        render(<Wishlist />);

        expect(screen.getByText('Loading wishlist...')).toBeInTheDocument();
    });
});

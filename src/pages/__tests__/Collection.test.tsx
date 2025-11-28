import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Collection from '../Collection';
import { SettingsProvider } from '../../contexts/SettingsContext';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

const mockCards = [
    {
        id: '1',
        scryfall_id: 'abc123',
        name: 'Black Lotus',
        set_code: 'lea',
        collector_number: '232',
        condition: 'NM',
        purchase_price: 1000.0,
        current_price: 5000.0,
        quantity: 1,
        is_foil: false,
        image_uri: 'https://example.com/image.jpg',
    },
    {
        id: '2',
        scryfall_id: 'def456',
        name: 'Mox Pearl',
        set_code: 'lea',
        collector_number: '233',
        condition: 'LP',
        purchase_price: 800.0,
        current_price: 3000.0,
        quantity: 2,
        is_foil: true,
        image_uri: 'https://example.com/image2.jpg',
    },
];

describe('Collection Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders collection header and stats', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation((cmd) => {
            if (cmd === 'get_collection') return Promise.resolve(mockCards);
            if (cmd === 'get_all_tags') return Promise.resolve([]);
            if (cmd === 'get_collection_sets') return Promise.resolve(['lea']);
            return Promise.resolve([]);
        });

        render(
            <SettingsProvider>
                <Collection />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('My Collection')).toBeInTheDocument();
            expect(screen.getByText('3 cards collected')).toBeInTheDocument(); // 1 + 2
        }, { timeout: 2000 });
    });

    it('displays cards in grid', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation((cmd) => {
            if (cmd === 'get_collection') return Promise.resolve(mockCards);
            if (cmd === 'get_all_tags') return Promise.resolve([]);
            if (cmd === 'get_collection_sets') return Promise.resolve(['lea']);
            return Promise.resolve([]);
        });

        render(
            <SettingsProvider>
                <Collection />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Black Lotus')).toBeInTheDocument();
            expect(screen.getByText('Mox Pearl')).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('filters cards by name', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation((cmd, args: any) => {
            if (cmd === 'get_collection') {
                if (args?.searchTerm === 'Lotus') {
                    return Promise.resolve([mockCards[0]]);
                }
                return Promise.resolve(mockCards);
            }
            if (cmd === 'get_all_tags') return Promise.resolve([]);
            if (cmd === 'get_collection_sets') return Promise.resolve(['lea']);
            return Promise.resolve([]);
        });

        render(
            <SettingsProvider>
                <Collection />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Black Lotus')).toBeInTheDocument();
        }, { timeout: 2000 });

        const searchInput = screen.getByPlaceholderText('Filter by name...');
        fireEvent.change(searchInput, { target: { value: 'Lotus' } });

        // Wait for debounce and effect
        await waitFor(() => {
            expect(invoke).toHaveBeenCalledWith('get_collection', expect.objectContaining({
                searchTerm: 'Lotus'
            }));
            expect(screen.getByText('Black Lotus')).toBeInTheDocument();
            expect(screen.queryByText('Mox Pearl')).not.toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('opens delete confirmation dialog', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation((cmd) => {
            if (cmd === 'get_collection') return Promise.resolve(mockCards);
            if (cmd === 'get_all_tags') return Promise.resolve([]);
            if (cmd === 'get_collection_sets') return Promise.resolve(['lea']);
            return Promise.resolve([]);
        });

        render(
            <SettingsProvider>
                <Collection />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Black Lotus')).toBeInTheDocument();
        }, { timeout: 2000 });

        // Hover over card to show delete button (simulated by just finding the button since hover is hard in jsdom)
        // Note: The delete button is rendered but hidden with opacity. We can still click it in tests.
        const deleteButtons = screen.getAllByText('🗑️ Delete');
        fireEvent.click(deleteButtons[0]);

        expect(screen.getByText('Delete Card')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete this card/)).toBeInTheDocument();
    });

    it('opens card details modal on click', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        const mockScryfallCard = {
            id: 'abc123',
            name: 'Black Lotus',
            set: 'lea',
            set_name: 'Limited Edition Alpha',
            collector_number: '232',
            released_at: '1993-08-05',
            rarity: 'rare',
            image_uris: {
                normal: 'https://example.com/image.jpg',
            },
            prices: {
                usd: '1000.00',
            },
        };

        vi.mocked(invoke).mockImplementation((cmd) => {
            if (cmd === 'get_collection') return Promise.resolve(mockCards);
            if (cmd === 'get_card') return Promise.resolve(mockScryfallCard);
            if (cmd === 'get_all_tags') return Promise.resolve([]);
            if (cmd === 'get_card_tags') return Promise.resolve([]);
            if (cmd === 'get_collection_sets') return Promise.resolve(['lea']);
            return Promise.resolve(undefined);
        });

        render(
            <SettingsProvider>
                <Collection />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Black Lotus')).toBeInTheDocument();
        }, { timeout: 2000 });

        fireEvent.click(screen.getByText('Black Lotus'));

        await waitFor(() => {
            expect(invoke).toHaveBeenCalledWith('get_card', { scryfallId: 'abc123' });
            expect(screen.getByText('Card Details')).toBeInTheDocument();
            expect(screen.getByText('Limited Edition Alpha')).toBeInTheDocument();
        }, { timeout: 2000 });
    });
});

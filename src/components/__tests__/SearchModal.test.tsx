import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchModal from '../SearchModal';
import { SettingsProvider } from '../../contexts/SettingsContext';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

const mockSearchResults = {
    data: [
        {
            id: 'test-id-1',
            name: 'Test Card 1',
            set: 'tst',
            set_name: 'Test Set',
            collector_number: '1',
            rarity: 'common',
            image_uris: {
                small: 'https://example.com/small.jpg',
                normal: 'https://example.com/normal.jpg',
            },
            prices: { usd: '1.00', usd_foil: '2.00', eur: '0.90', eur_foil: '1.80' },
            oracle_id: 'oracle-id-1',
        },
        {
            id: 'test-id-2',
            name: 'Test Card 2',
            set: 'tst',
            set_name: 'Test Set',
            collector_number: '2',
            rarity: 'rare',
            image_uris: {
                small: 'https://example.com/small2.jpg',
                normal: 'https://example.com/normal2.jpg',
            },
            prices: { usd: '5.00', usd_foil: '10.00', eur: '4.50', eur_foil: '9.00' },
            oracle_id: 'oracle-id-2',
        }
    ],
    has_more: false,
    total_cards: 2
};

describe('SearchModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly when open', () => {
        render(
            <SettingsProvider>
                <SearchModal isOpen={true} onClose={() => { }} onCardAdded={() => { }} />
            </SettingsProvider>
        );

        expect(screen.getByPlaceholderText('Search card name...')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <SettingsProvider>
                <SearchModal isOpen={false} onClose={() => { }} onCardAdded={() => { }} />
            </SettingsProvider>
        );

        expect(screen.queryByPlaceholderText('Search card name...')).not.toBeInTheDocument();
    });

    it('searches for cards', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation((cmd) => {
            if (cmd === 'search_scryfall') return Promise.resolve(mockSearchResults);
            return Promise.resolve(undefined);
        });

        render(
            <SettingsProvider>
                <SearchModal isOpen={true} onClose={() => { }} onCardAdded={() => { }} />
            </SettingsProvider>
        );

        const input = screen.getByPlaceholderText('Search card name...');
        fireEvent.change(input, { target: { value: 'Test' } });

        // Wait for debounce and search
        await waitFor(() => {
            expect(invoke).toHaveBeenCalledWith('search_scryfall', {
                query: 'Test',
                page: 1
            });
        }, { timeout: 1000 });

        expect(screen.getByText('Test Card 1')).toBeInTheDocument();
        expect(screen.getByText('Test Card 2')).toBeInTheDocument();
    });

    it('selects a card and fetches languages', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation((cmd, args: any) => {
            if (cmd === 'search_scryfall') return Promise.resolve(mockSearchResults);
            if (cmd === 'get_card_languages') {
                if (args.oracleId === 'oracle-id-1') return Promise.resolve(['en', 'fr']);
                return Promise.resolve([]);
            }
            return Promise.resolve(undefined);
        });

        render(
            <SettingsProvider>
                <SearchModal isOpen={true} onClose={() => { }} onCardAdded={() => { }} />
            </SettingsProvider>
        );

        // Perform search
        const input = screen.getByPlaceholderText('Search card name...');
        fireEvent.change(input, { target: { value: 'Test' } });

        await waitFor(() => {
            expect(screen.getByText('Test Card 1')).toBeInTheDocument();
        });

        // Click on the first card
        fireEvent.click(screen.getByText('Test Card 1'));

        // Verify language fetch
        await waitFor(() => {
            expect(invoke).toHaveBeenCalledWith('get_card_languages', {
                oracleId: 'oracle-id-1',
                setCode: 'tst'
            });
        });

        // Check if details are shown
        expect(screen.getByText('Test Card 1', { selector: 'h3' })).toBeInTheDocument();

        // Check languages dropdown
        // Note: The dropdown might default to English, but we should see French in the options if we open it
        // Or just check that the select contains the option
        // Since we can't easily open the select in JSDOM without user event library sometimes, we can check the options directly if they are rendered.
        // Assuming standard select rendering:
        // Wait, standard select options are always in the DOM? Yes.

        // Wait for state update
        await waitFor(() => {
            // We can check if 'French' text is present in the document (inside an option)
            // LANGUAGE_NAMES['fr'] is 'French'
            expect(screen.getByText('French')).toBeInTheDocument();
        });
    });

    it('adds a card to collection', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation((cmd) => {
            if (cmd === 'search_scryfall') return Promise.resolve(mockSearchResults);
            if (cmd === 'get_card_languages') return Promise.resolve(['en']);
            return Promise.resolve(undefined);
        });
        const onCardAdded = vi.fn();
        const onClose = vi.fn();

        render(
            <SettingsProvider>
                <SearchModal isOpen={true} onClose={onClose} onCardAdded={onCardAdded} />
            </SettingsProvider>
        );

        // Search and select
        const input = screen.getByPlaceholderText('Search card name...');
        fireEvent.change(input, { target: { value: 'Test' } });
        await waitFor(() => screen.getByText('Test Card 1'));
        fireEvent.click(screen.getByText('Test Card 1'));

        // Click Add
        const addButton = screen.getByTestId('submit-collection');
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(invoke).toHaveBeenCalledWith('add_card', expect.objectContaining({
                args: expect.objectContaining({
                    scryfall_id: 'test-id-1',
                    quantity: 1,
                    language: 'English'
                })
            }));
            expect(onCardAdded).toHaveBeenCalledWith('test-id-1');
            expect(onClose).toHaveBeenCalled();
        });
    });
});

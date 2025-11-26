import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CardDetailsModal from '../CardDetailsModal';
import { SettingsProvider } from '../../contexts/SettingsContext';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

const mockCard = {
    id: 'test-id-123',
    name: 'Test Card',
    set: 'tst',
    set_name: 'Test Set',
    collector_number: '1',
    rarity: 'rare',
    artist: 'Test Artist',
    released_at: '2024-01-01',
    image_uris: {
        small: 'https://example.com/small.jpg',
        normal: 'https://example.com/normal.jpg',
        large: 'https://example.com/large.jpg',
        png: 'https://example.com/png.png',
        art_crop: 'https://example.com/art_crop.jpg',
        border_crop: 'https://example.com/border_crop.jpg',
    },
    prices: {
        usd: '10.00',
        usd_foil: '20.00',
        eur: '9.00',
        eur_foil: '18.00',
    },
    type_line: 'Creature — Test',
    oracle_text: 'Test oracle text',
    oracle_id: 'test-oracle-id',
};

describe('CardDetailsModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders card details correctly', () => {
        render(
            <SettingsProvider>
                <CardDetailsModal card={mockCard} onClose={() => { }} />
            </SettingsProvider>
        );

        expect(screen.getByText('Test Card')).toBeInTheDocument();
        expect(screen.getByText('Creature — Test')).toBeInTheDocument();
        expect(screen.getByText('Test Set')).toBeInTheDocument();
        expect(screen.getByText('Test oracle text')).toBeInTheDocument();
    });

    it('switches between Collection and Wishlist tabs', () => {
        render(
            <SettingsProvider>
                <CardDetailsModal card={mockCard} onClose={() => { }} />
            </SettingsProvider>
        );

        // Default is Collection tab
        expect(screen.getByText(/Purchase Price \([€$]\)/)).toBeInTheDocument();

        // Switch to Wishlist
        fireEvent.click(screen.getByText('Add to Wishlist'));
        expect(screen.getByText(/Target Price \([€$]\)/)).toBeInTheDocument();

        // Switch back to Collection
        fireEvent.click(screen.getByText('Add to Collection'));
        expect(screen.getByText(/Purchase Price \([€$]\)/)).toBeInTheDocument();
    });

    it('fetches and displays available languages', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation((cmd, args: any) => {
            if (cmd === 'get_card_languages') {
                if (args.oracleId === mockCard.oracle_id) {
                    return Promise.resolve(['en', 'es', 'ja']);
                }
                return Promise.resolve([]);
            }
            return Promise.resolve(undefined);
        });

        render(
            <SettingsProvider>
                <CardDetailsModal card={mockCard} onClose={() => { }} />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(invoke).toHaveBeenCalledWith('get_card_languages', {
                oracleId: mockCard.oracle_id,
                setCode: mockCard.set
            });
        });

        // Check if languages are populated in the dropdown
        const languageSelect = screen.getByLabelText('Language');
        fireEvent.click(languageSelect);

        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('Spanish')).toBeInTheDocument();
        expect(screen.getByText('Japanese')).toBeInTheDocument();
    });

    it('submits add to collection form', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation((cmd) => {
            if (cmd === 'get_card_languages') return Promise.resolve(['en']);
            return Promise.resolve(undefined);
        });
        const onClose = vi.fn();
        const onCardAdded = vi.fn();

        render(
            <SettingsProvider>
                <CardDetailsModal card={mockCard} onClose={onClose} onCardAdded={onCardAdded} />
            </SettingsProvider>
        );

        // Fill form
        const quantityInput = screen.getByLabelText('Quantity');
        fireEvent.change(quantityInput, { target: { value: '2' } });

        // Submit
        const addButton = screen.getByTestId('submit-collection');
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(invoke).toHaveBeenCalledWith('add_card', expect.objectContaining({
                args: expect.objectContaining({
                    scryfall_id: mockCard.id,
                    quantity: 2,
                    language: 'English', // Default
                })
            }));
            expect(onCardAdded).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('submits add to wishlist form', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation((cmd) => {
            if (cmd === 'get_card_languages') return Promise.resolve(['en']);
            return Promise.resolve(undefined);
        });
        const onClose = vi.fn();
        const onCardAdded = vi.fn();

        render(
            <SettingsProvider>
                <CardDetailsModal card={mockCard} onClose={onClose} onCardAdded={onCardAdded} />
            </SettingsProvider>
        );

        // Switch to Wishlist
        fireEvent.click(screen.getByText('Add to Wishlist'));

        // Fill form
        const notesInput = screen.getByLabelText('Notes');
        fireEvent.change(notesInput, { target: { value: 'Test note' } });

        // Submit
        const addButton = screen.getByTestId('submit-wishlist');
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(invoke).toHaveBeenCalledWith('add_to_wishlist', expect.objectContaining({
                card: mockCard,
                notes: 'Test note',
            }));
            expect(onCardAdded).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });
});


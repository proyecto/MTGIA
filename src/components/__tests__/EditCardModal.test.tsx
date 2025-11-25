import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditCardModal from '../EditCardModal';
import { CollectionCard } from '../../types';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

const mockCard: CollectionCard = {
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
    language: 'English',
};

describe('EditCardModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when closed', () => {
        render(
            <EditCardModal
                isOpen={false}
                onClose={() => { }}
                onCardUpdated={() => { }}
                card={mockCard}
            />
        );
        expect(screen.queryByText('Edit Card')).not.toBeInTheDocument();
    });

    it('renders card details when open', () => {
        render(
            <EditCardModal
                isOpen={true}
                onClose={() => { }}
                onCardUpdated={() => { }}
                card={mockCard}
            />
        );
        expect(screen.getByText('Edit Card')).toBeInTheDocument();
        expect(screen.getByText('Black Lotus')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1000')).toBeInTheDocument(); // Purchase price
        expect(screen.getByDisplayValue('Near Mint (NM)')).toBeInTheDocument();
    });

    it('updates card details on save', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockResolvedValue(undefined);
        const onCardUpdated = vi.fn();
        const onClose = vi.fn();

        render(
            <EditCardModal
                isOpen={true}
                onClose={onClose}
                onCardUpdated={onCardUpdated}
                card={mockCard}
            />
        );

        // Change condition
        const comboboxes = screen.getAllByRole('combobox');
        fireEvent.change(comboboxes[0], { target: { value: 'LP' } }); // First combobox is condition

        // Change price
        fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1200' } });

        // Save
        fireEvent.click(screen.getByText('Save Changes'));

        await waitFor(() => {
            expect(invoke).toHaveBeenCalledWith('update_card_details', {
                id: mockCard.id,
                condition: 'LP',
                language: 'English',
                purchasePrice: 1200,
            });
            expect(onCardUpdated).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('closes modal on cancel', () => {
        const onClose = vi.fn();
        render(
            <EditCardModal
                isOpen={true}
                onClose={onClose}
                onCardUpdated={() => { }}
                card={mockCard}
            />
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalled();
    });
});

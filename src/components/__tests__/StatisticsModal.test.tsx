import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import StatisticsModal from '../StatisticsModal';
import { SettingsProvider } from '../../contexts/SettingsContext';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

const mockStats = {
    total_investment: 1000.0,
    total_value: 2000.0,
    total_gain: 1000.0,
    total_roi_percentage: 100.0,
    total_cards: 100,
    unique_cards: 80,
    top_winners: [],
    top_losers: [],
    top_cards_by_price: [
        {
            id: '1',
            name: 'Black Lotus',
            set_code: 'lea',
            quantity: 1,
            purchase_price: 1000.0,
            current_price: 5000.0,
            total_gain: 4000.0,
            roi_percentage: 400.0,
        }
    ],
    set_distribution: [
        ['lea', 10],
        ['tst', 90],
    ],
};

describe('StatisticsModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when closed', () => {
        render(
            <SettingsProvider>
                <StatisticsModal isOpen={false} onClose={() => { }} cards={[]} />
            </SettingsProvider>
        );
        expect(screen.queryByText('Collection Statistics')).not.toBeInTheDocument();
    });

    it('renders statistics when open', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockResolvedValue(mockStats);

        render(
            <SettingsProvider>
                <StatisticsModal isOpen={true} onClose={() => { }} cards={[]} />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Collection Statistics')).toBeInTheDocument();
            expect(screen.getByText(/2.?000,00/)).toBeInTheDocument(); // Default EUR
            expect(screen.getByText('100')).toBeInTheDocument(); // Total Cards
            expect(screen.getByText('80')).toBeInTheDocument(); // Unique Cards
        });

        expect(invoke).toHaveBeenCalledWith('get_collection_stats');
    });

    it('displays top cards', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockResolvedValue(mockStats);

        render(
            <SettingsProvider>
                <StatisticsModal isOpen={true} onClose={() => { }} cards={[]} />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Black Lotus')).toBeInTheDocument();
            expect(screen.getByText('lea')).toBeInTheDocument();
            expect(screen.getByText(/5.?000,00/)).toBeInTheDocument();
        });
    });

    it('displays set distribution', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockResolvedValue(mockStats);

        render(
            <SettingsProvider>
                <StatisticsModal isOpen={true} onClose={() => { }} cards={[]} />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('lea')).toBeInTheDocument();
            expect(screen.getByText('10 cards')).toBeInTheDocument();
            expect(screen.getByText('tst')).toBeInTheDocument();
            expect(screen.getByText('90 cards')).toBeInTheDocument();
        });
    });

    it('closes on button click', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockResolvedValue(mockStats);
        const onClose = vi.fn();

        render(
            <SettingsProvider>
                <StatisticsModal isOpen={true} onClose={onClose} cards={[]} />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Collection Statistics')).toBeInTheDocument();
        });

        // Find close button (usually the first button or by icon)
        // The modal has a close button in the header
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]);

        expect(onClose).toHaveBeenCalled();
    });
});

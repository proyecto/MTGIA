import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MarketTrends from '../MarketTrends';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { invoke } from '@tauri-apps/api/core';

// Mock the invoke function
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

// Mock CardDetailsModal since we don't need to test its internals here
vi.mock('../../components/CardDetailsModal', () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="card-details-modal">
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

const mockCard = {
    id: '123',
    name: 'Black Lotus',
    set: 'lea',
    set_name: 'Limited Edition Alpha',
    collector_number: '232',
    released_at: '1993-08-05',
    rarity: 'rare',
    image_uris: {
        small: 'http://example.com/small.jpg',
        normal: 'http://example.com/normal.jpg',
        large: 'http://example.com/large.jpg',
        png: 'http://example.com/png.jpg',
        art_crop: 'http://example.com/art_crop.jpg',
        border_crop: 'http://example.com/border_crop.jpg',
    },
    prices: {
        usd: '10000.00',
        eur: '9000.00',
    },
};

const mockTrendsData = {
    standard_staples: [mockCard],
    modern_staples: [mockCard],
    commander_popularity: [mockCard],
    new_hot: [mockCard],
};

describe('MarketTrends', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        vi.mocked(invoke).mockReturnValue(new Promise(() => { })); // Never resolves

        render(
            <SettingsProvider>
                <MarketTrends />
            </SettingsProvider>
        );
    });

    it('renders trends data after fetch', async () => {
        vi.mocked(invoke).mockResolvedValue(mockTrendsData);

        render(
            <SettingsProvider>
                <MarketTrends />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Global Market Trends')).toBeInTheDocument();
        });

        expect(screen.getByText('Standard Staples (Top Value)')).toBeInTheDocument();
        expect(screen.getByText('Modern Staples (Top Value)')).toBeInTheDocument();
        expect(screen.getByText('Commander Popularity (Most Played)')).toBeInTheDocument();
        expect(screen.getByText('New & Hot (Last 30 Days)')).toBeInTheDocument();

        // Check if cards are rendered
        const cardNames = screen.getAllByText('Black Lotus');
        expect(cardNames.length).toBeGreaterThan(0);
    });

    it('handles fetch error', async () => {
        vi.mocked(invoke).mockRejectedValue(new Error('Failed to fetch'));

        render(
            <SettingsProvider>
                <MarketTrends />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Failed to load market trends. Please try again later.')).toBeInTheDocument();
        });
    });

    it('opens card details modal on click', async () => {
        vi.mocked(invoke).mockResolvedValue(mockTrendsData);

        render(
            <SettingsProvider>
                <MarketTrends />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Global Market Trends')).toBeInTheDocument();
        });

        const cards = screen.getAllByText('Black Lotus');
        fireEvent.click(cards[0]);

        await waitFor(() => {
            expect(screen.getByTestId('card-details-modal')).toBeInTheDocument();
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CardPriceHistoryChart from '../CardPriceHistoryChart';
import { SettingsProvider } from '../../contexts/SettingsContext';

// Mock Tauri invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
    invoke: (...args: unknown[]) => mockInvoke(...args),
}));

// Mock Recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
    LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
    ReferenceLine: () => <div data-testid="reference-line" />,
}));

const renderWithSettings = (component: React.ReactElement) => {
    return render(
        <SettingsProvider>
            {component}
        </SettingsProvider>
    );
};

describe('CardPriceHistoryChart', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state initially', () => {
        mockInvoke.mockImplementation(() => new Promise(() => { })); // Never resolves
        renderWithSettings(<CardPriceHistoryChart cardId="test-card-id" />);

        expect(screen.getByText((_content, element) => {
            return element?.className?.includes('animate-spin') || false;
        })).toBeInTheDocument();
    });

    it('displays error message when fetch fails', async () => {
        mockInvoke.mockRejectedValue(new Error('Failed to fetch'));

        renderWithSettings(<CardPriceHistoryChart cardId="test-card-id" />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load price history')).toBeInTheDocument();
        });
    });

    it('displays empty state when no history available', async () => {
        mockInvoke.mockResolvedValue([]);

        renderWithSettings(<CardPriceHistoryChart cardId="test-card-id" />);

        await waitFor(() => {
            expect(screen.getByText('No price history available yet')).toBeInTheDocument();
            expect(screen.getByText('Update prices to start tracking')).toBeInTheDocument();
        });
    });

    it('displays price history chart with data', async () => {
        const mockHistory = [
            { date: '2024-01-01', price: 10.0, currency: 'USD' },
            { date: '2024-01-02', price: 12.0, currency: 'USD' },
            { date: '2024-01-03', price: 15.0, currency: 'USD' },
        ];

        mockInvoke.mockResolvedValue(mockHistory);

        renderWithSettings(<CardPriceHistoryChart cardId="test-card-id" />);

        await waitFor(() => {
            expect(screen.getByText('Price History')).toBeInTheDocument();
            expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        });
    });

    it('displays statistics correctly', async () => {
        const mockHistory = [
            { date: '2024-01-01', price: 10.0, currency: 'USD' },
            { date: '2024-01-02', price: 20.0, currency: 'USD' },
            { date: '2024-01-03', price: 15.0, currency: 'USD' },
        ];

        mockInvoke.mockResolvedValue(mockHistory);

        renderWithSettings(<CardPriceHistoryChart cardId="test-card-id" />);

        await waitFor(() => {
            expect(screen.getByText('Current')).toBeInTheDocument();
            expect(screen.getByText('Average')).toBeInTheDocument();
            expect(screen.getByText('Min')).toBeInTheDocument();
            expect(screen.getByText('Max')).toBeInTheDocument();
        });
    });

    it('displays change percentage when purchase price is provided', async () => {
        const mockHistory = [
            { date: '2024-01-01', price: 10.0, currency: 'USD' },
            { date: '2024-01-02', price: 15.0, currency: 'USD' },
        ];

        mockInvoke.mockResolvedValue(mockHistory);

        renderWithSettings(<CardPriceHistoryChart cardId="test-card-id" purchasePrice={10.0} />);

        await waitFor(() => {
            expect(screen.getByText('Change since purchase')).toBeInTheDocument();
            // 15.0 from 10.0 is +50%
            expect(screen.getByText('+50.00%')).toBeInTheDocument();
        });
    });

    it('calls invoke with correct parameters', async () => {
        mockInvoke.mockResolvedValue([]);

        renderWithSettings(<CardPriceHistoryChart cardId="test-card-123" />);

        await waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('get_card_price_history', { cardId: 'test-card-123' });
        });
    });
});

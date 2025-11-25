import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProfitabilityReport from '../ProfitabilityReport';
import { SettingsProvider } from '../../contexts/SettingsContext';

// Mock Tauri invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
    invoke: (...args: unknown[]) => mockInvoke(...args),
}));

// Mock URL.createObjectURL
window.URL.createObjectURL = vi.fn();

const renderWithSettings = (component: React.ReactElement) => {
    return render(
        <SettingsProvider>
            {component}
        </SettingsProvider>
    );
};

const mockStats = {
    total_investment: 100.0,
    total_value: 150.0,
    total_gain: 50.0,
    total_roi_percentage: 50.0,
    top_winners: [
        {
            id: '1',
            name: 'Winning Card',
            set_code: 'TST',
            quantity: 1,
            purchase_price: 10.0,
            current_price: 20.0,
            total_gain: 10.0,
            roi_percentage: 100.0
        }
    ],
    top_losers: [
        {
            id: '2',
            name: 'Losing Card',
            set_code: 'TST',
            quantity: 1,
            purchase_price: 20.0,
            current_price: 10.0,
            total_gain: -10.0,
            roi_percentage: -50.0
        }
    ]
};

describe('ProfitabilityReport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state initially', () => {
        mockInvoke.mockImplementation(() => new Promise(() => { }));
        renderWithSettings(<ProfitabilityReport />);
        // Check for pulse animation class which indicates loading
        const loadingElements = document.getElementsByClassName('animate-pulse');
        expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('displays error message when fetch fails', async () => {
        mockInvoke.mockRejectedValue(new Error('Failed to fetch'));
        renderWithSettings(<ProfitabilityReport />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load profitability report')).toBeInTheDocument();
        });
    });

    it('displays statistics correctly', async () => {
        mockInvoke.mockResolvedValue(mockStats);
        renderWithSettings(<ProfitabilityReport />);

        await waitFor(() => {
            expect(screen.getByText('Total Investment')).toBeInTheDocument();
            // Match loosely to allow for currency differences or use regex
            expect(screen.getByText(/100[.,]00/)).toBeInTheDocument();
            expect(screen.getByText('Current Value')).toBeInTheDocument();
            expect(screen.getByText(/150[.,]00/)).toBeInTheDocument();
            expect(screen.getByText('Total Gain/Loss')).toBeInTheDocument();
            expect(screen.getByText(/\+.*50[.,]00/)).toBeInTheDocument();
            expect(screen.getByText('Total ROI')).toBeInTheDocument();
            expect(screen.getByText('50.00%')).toBeInTheDocument();
        });
    });

    it('displays winners and losers tables', async () => {
        mockInvoke.mockResolvedValue(mockStats);
        renderWithSettings(<ProfitabilityReport />);

        await waitFor(() => {
            expect(screen.getByText('Top Winners 🚀')).toBeInTheDocument();
            expect(screen.getByText('Winning Card')).toBeInTheDocument();
            expect(screen.getByText('Top Losers 📉')).toBeInTheDocument();
            expect(screen.getByText('Losing Card')).toBeInTheDocument();
        });
    });

    it('handles export to CSV', async () => {
        mockInvoke.mockResolvedValue(mockStats);
        renderWithSettings(<ProfitabilityReport />);

        await waitFor(() => {
            expect(screen.getByText('Export CSV')).toBeInTheDocument();
        });

        const exportBtn = screen.getByText('Export CSV');
        fireEvent.click(exportBtn);

        expect(window.URL.createObjectURL).toHaveBeenCalled();
    });
});

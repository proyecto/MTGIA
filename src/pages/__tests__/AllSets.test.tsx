import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AllSets from '../AllSets';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

describe('AllSets Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all sets header', async () => {
        const mockSets = [
            {
                id: '1',
                code: 'dom',
                name: 'Dominaria',
                released_at: '2018-04-27',
                icon_svg_uri: 'https://example.com/icon.svg',
                set_type: 'expansion',
                card_count: 269,
            },
        ];
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockResolvedValue(mockSets);

        render(<AllSets />);

        await waitFor(() => {
            expect(screen.getByText('All Sets')).toBeInTheDocument();
        });
    });

    it('displays sets when loaded', async () => {
        const mockSets = [
            {
                id: '1',
                code: 'dom',
                name: 'Dominaria',
                released_at: '2018-04-27',
                icon_svg_uri: 'https://example.com/icon.svg',
                set_type: 'expansion',
                card_count: 269,
            },
        ];

        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockResolvedValue(mockSets);

        render(<AllSets />);

        await waitFor(() => {
            expect(screen.getByText('Dominaria')).toBeInTheDocument();
        });
    });

    it('shows loading state initially', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation(() => new Promise(() => { }));

        render(<AllSets />);

        expect(screen.getByText('Loading sets...')).toBeInTheDocument();
    });

    it('displays search input', async () => {
        const mockSets = [
            {
                id: '1',
                code: 'dom',
                name: 'Dominaria',
                released_at: '2018-04-27',
                icon_svg_uri: 'https://example.com/icon.svg',
                set_type: 'expansion',
                card_count: 269,
            },
        ];
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockResolvedValue(mockSets);

        render(<AllSets />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
        });
    });
});

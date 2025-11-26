import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TagSelector from '../TagSelector';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe('TagSelector', () => {
    const mockTags = [
        { id: 1, name: 'Commander', color: '#EF4444' },
        { id: 2, name: 'Trade', color: '#3B82F6' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation
        mockInvoke.mockImplementation((cmd: string) => {
            if (cmd === 'get_all_tags') return Promise.resolve(mockTags);
            if (cmd === 'get_card_tags') return Promise.resolve([]);
            if (cmd === 'create_tag') return Promise.resolve(3);
            if (cmd === 'add_tag_to_card') return Promise.resolve();
            if (cmd === 'remove_tag_from_card') return Promise.resolve();
            if (cmd === 'delete_tag') return Promise.resolve();
            return Promise.resolve(null);
        });
    });

    it('renders available tags when managing', async () => {
        render(<TagSelector cardId="test-card-1" />);

        // Click manage tags
        fireEvent.click(screen.getByText('+ Manage Tags'));

        await waitFor(() => {
            expect(screen.getByText('Commander')).toBeInTheDocument();
            expect(screen.getByText('Trade')).toBeInTheDocument();
        });
    });

    it('creates a new tag', async () => {
        render(<TagSelector cardId="test-card-1" />);

        fireEvent.click(screen.getByText('+ Manage Tags'));

        const input = screen.getByPlaceholderText('Tag name...');
        fireEvent.change(input, { target: { value: 'New Tag' } });

        fireEvent.click(screen.getByText('Add'));

        await waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('create_tag', expect.objectContaining({
                name: 'New Tag'
            }));
        });
    });

    it('toggles a tag on a card', async () => {
        render(<TagSelector cardId="test-card-1" />);

        fireEvent.click(screen.getByText('+ Manage Tags'));

        await waitFor(() => {
            screen.getByText('Commander');
        });

        // Click to add
        fireEvent.click(screen.getByText('Commander'));

        await waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('add_tag_to_card', {
                cardId: 'test-card-1',
                tagId: 1
            });
        });
    });

    it('displays assigned tags', async () => {
        mockInvoke.mockImplementation((cmd: string) => {
            if (cmd === 'get_all_tags') return Promise.resolve(mockTags);
            if (cmd === 'get_card_tags') return Promise.resolve([mockTags[0]]); // Commander assigned
            return Promise.resolve(null);
        });

        render(<TagSelector cardId="test-card-1" />);

        await waitFor(() => {
            // Should be visible without clicking manage
            expect(screen.getByText('Commander')).toBeInTheDocument();
        });
    });
});

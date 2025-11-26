import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TagManager from '../TagManager';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe('TagManager', () => {
    const mockTags = [
        { id: 1, name: 'Commander', color: '#EF4444' },
        { id: 2, name: 'Trade', color: '#3B82F6' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation
        mockInvoke.mockImplementation((cmd: string) => {
            if (cmd === 'get_all_tags') return Promise.resolve(mockTags);
            if (cmd === 'create_tag') return Promise.resolve(3);
            if (cmd === 'delete_tag') return Promise.resolve();
            return Promise.resolve(null);
        });
    });

    it('renders existing tags', async () => {
        render(<TagManager onClose={() => { }} />);

        await waitFor(() => {
            expect(screen.getByText('Commander')).toBeInTheDocument();
            expect(screen.getByText('Trade')).toBeInTheDocument();
        });
    });

    it('creates a new tag', async () => {
        render(<TagManager onClose={() => { }} />);

        const input = screen.getByPlaceholderText('e.g., Commander, Trade, Foil');
        fireEvent.change(input, { target: { value: 'New Tag' } });

        // Select color (assuming default is selected, or we can click one)
        // The color picker inputs are buttons with aria-label
        const colorInputs = screen.getAllByLabelText(/Select color/);
        fireEvent.click(colorInputs[1]); // Select second color

        fireEvent.click(screen.getByText('Create Tag'));

        await waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('create_tag', expect.objectContaining({
                name: 'New Tag',
                // We can't easily predict the exact color hex without checking the component implementation details, 
                // but we can check it was called.
            }));
        });
    });

    it('deletes a tag', async () => {
        // Mock window.confirm
        const confirmSpy = vi.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => true);

        render(<TagManager onClose={() => { }} />);

        await waitFor(() => {
            expect(screen.getByText('Commander')).toBeInTheDocument();
        });

        // Find delete button for first tag (Commander)
        const deleteButtons = screen.getAllByTitle('Delete tag');
        fireEvent.click(deleteButtons[0]);

        expect(confirmSpy).toHaveBeenCalled();

        await waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('delete_tag', { id: 1 });
        });

        confirmSpy.mockRestore();
    });

    it('closes the modal', () => {
        const onClose = vi.fn();
        render(<TagManager onClose={onClose} />);

        fireEvent.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalled();
    });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScannerModal from '../ScannerModal';
import { invoke } from '@tauri-apps/api/core';

// Mock dependencies
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

vi.mock('react-webcam', () => ({
    default: class WebcamMock extends React.Component {
        getScreenshot() {
            return 'data:image/jpeg;base64,fake-image-data';
        }
        render() {
            return <div data-testid="webcam">Webcam Mock</div>;
        }
    },
}));

vi.mock('tesseract.js', () => ({
    default: {
        recognize: vi.fn().mockResolvedValue({
            data: { text: 'Sol Ring' }
        }),
    },
}));

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe('ScannerModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockInvoke.mockResolvedValue({ data: [] });
    });

    it('renders correctly', () => {
        render(<ScannerModal onClose={() => { }} onCardAdded={() => { }} />);
        expect(screen.getByText('Card Scanner (Experimental)')).toBeInTheDocument();
        expect(screen.getByTestId('webcam')).toBeInTheDocument();
    });

    it('scans and searches for a card', async () => {
        // Mock Canvas API
        window.HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
            drawImage: vi.fn(),
            getImageData: vi.fn().mockReturnValue({
                data: new Uint8ClampedArray([0, 0, 0, 255]), // Mock pixel data
            }),
            putImageData: vi.fn(),
        });
        window.HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,processed');

        // Mock Image loading
        global.Image = class extends Image {
            constructor() {
                super();
                setTimeout(() => {
                    if (this.onload) this.onload(new Event('load'));
                }, 0);
            }
        } as any;

        render(<ScannerModal onClose={() => { }} onCardAdded={() => { }} />);

        const captureButton = screen.getByLabelText('Capture and Scan');
        fireEvent.click(captureButton);

        await waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('search_scryfall', {
                query: 'Sol Ring',
                page: 1
            });
        });
    });
});

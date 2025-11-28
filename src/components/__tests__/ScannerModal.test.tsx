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

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
const mockEnumerateDevices = vi.fn();

Object.defineProperty(global.navigator, 'mediaDevices', {
    writable: true,
    value: {
        getUserMedia: mockGetUserMedia,
        enumerateDevices: mockEnumerateDevices,
    },
});

describe('ScannerModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockInvoke.mockResolvedValue({
            features: {},
            detected_name: '',
            feature_description: '',
            search_query: '',
            candidates: []
        });

        // Default: camera is available
        mockEnumerateDevices.mockResolvedValue([
            { kind: 'videoinput', deviceId: 'camera1', label: 'Front Camera' }
        ]);
        mockGetUserMedia.mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }]
        });
    });

    it('renders correctly with camera available', async () => {
        render(<ScannerModal onClose={() => { }} onCardAdded={() => { }} />);

        await waitFor(() => {
            expect(screen.getByText('Card Scanner (Experimental)')).toBeInTheDocument();
        });

        // Should show camera mode by default when available
        await waitFor(() => {
            expect(screen.getByTestId('webcam')).toBeInTheDocument();
        });
    });

    it('renders file upload mode when no camera is available', async () => {
        // Mock no camera available
        mockEnumerateDevices.mockResolvedValue([]);

        render(<ScannerModal onClose={() => { }} onCardAdded={() => { }} />);

        await waitFor(() => {
            expect(screen.getByText('Upload Card Image')).toBeInTheDocument();
            expect(screen.getByText('📁 Choose Image')).toBeInTheDocument();
        });
    });

    it('renders file upload mode when camera access is denied', async () => {
        // Mock camera access denied
        mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

        render(<ScannerModal onClose={() => { }} onCardAdded={() => { }} />);

        await waitFor(() => {
            expect(screen.getByText('Upload Card Image')).toBeInTheDocument();
        });

        // Should show error message
        await waitFor(() => {
            expect(screen.getByText(/Camera access denied/)).toBeInTheDocument();
        });
    });

    it('allows switching between camera and file modes when camera is available', async () => {
        render(<ScannerModal onClose={() => { }} onCardAdded={() => { }} />);

        // Wait for camera to be detected
        await waitFor(() => {
            expect(screen.getByText('📷 Camera')).toBeInTheDocument();
        });

        // Click on file upload mode
        const fileButton = screen.getByText('📁 Upload File');
        fireEvent.click(fileButton);

        // Should show file upload UI
        await waitFor(() => {
            expect(screen.getByText('Upload Card Image')).toBeInTheDocument();
        });
    });

    it('scans and searches for a card using camera', async () => {
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

        await waitFor(() => {
            expect(screen.getByTestId('webcam')).toBeInTheDocument();
        });

        const captureButton = screen.getByLabelText('Capture and Scan');
        fireEvent.click(captureButton);

        await waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('recognize_card_with_features', {
                imageData: expect.any(String)
            });
        });
    });

    it('handles file upload and scans the image', async () => {
        // Mock Canvas API
        window.HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
            drawImage: vi.fn(),
            getImageData: vi.fn().mockReturnValue({
                data: new Uint8ClampedArray([0, 0, 0, 255]),
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

        // Mock FileReader
        const mockFileReaderInstance = {
            readAsDataURL: vi.fn(function (this: any) {
                setTimeout(() => {
                    if (this.onload) {
                        this.onload({ target: { result: 'data:image/jpeg;base64,fake-file-data' } });
                    }
                }, 0);
            }),
            result: 'data:image/jpeg;base64,fake-file-data',
            onload: null as any,
        };

        global.FileReader = vi.fn(function (this: any) {
            return mockFileReaderInstance;
        }) as any;

        render(<ScannerModal onClose={() => { }} onCardAdded={() => { }} />);

        // Wait for camera detection and switch to file mode
        await waitFor(() => {
            expect(screen.getByText('📁 Upload File')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('📁 Upload File'));

        await waitFor(() => {
            expect(screen.getByText('📁 Choose Image')).toBeInTheDocument();
        });

        // Create a fake file
        const file = new File(['fake-image'], 'card.jpg', { type: 'image/jpeg' });
        const input = document.getElementById('card-image-upload') as HTMLInputElement;

        // Trigger file upload
        Object.defineProperty(input, 'files', {
            value: [file],
            writable: false,
        });
        fireEvent.change(input);

        // Should process the file and search
        await waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('recognize_card_with_features', {
                imageData: expect.any(String)
            });
        }, { timeout: 3000 });
    });
});

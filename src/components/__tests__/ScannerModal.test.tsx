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
});

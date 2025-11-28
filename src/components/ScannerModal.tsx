import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { invoke } from '@tauri-apps/api/core';
import { ScryfallCard, RecognitionResult } from '../types';
import CardDetailsModal from './CardDetailsModal';

interface ScannerModalProps {
    onClose: () => void;
    onCardAdded: () => void;
}

type ScanMode = 'camera' | 'file';

export default function ScannerModal({ onClose, onCardAdded }: ScannerModalProps) {
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [scanning, setScanning] = useState(false);
    const [ocrText, setOcrText] = useState('');
    const [searchResults, setSearchResults] = useState<ScryfallCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
    const [status, setStatus] = useState('Ready to scan');
    const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
    const [scanMode, setScanMode] = useState<ScanMode>('camera');
    const [cameraError, setCameraError] = useState<string>('');

    // Detect camera availability
    useEffect(() => {
        async function checkCamera() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const hasCamera = devices.some(device => device.kind === 'videoinput');

                if (hasCamera) {
                    // Try to actually access the camera
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        stream.getTracks().forEach(track => track.stop());
                        setCameraAvailable(true);
                        setScanMode('camera');
                    } catch (error) {
                        console.error('Camera access denied:', error);
                        setCameraAvailable(false);
                        setScanMode('file');
                        setCameraError('Camera access denied. Using file upload mode.');
                    }
                } else {
                    setCameraAvailable(false);
                    setScanMode('file');
                    setStatus('No camera detected. Please upload an image.');
                }
            } catch (error) {
                console.error('Error checking camera:', error);
                setCameraAvailable(false);
                setScanMode('file');
                setStatus('Unable to detect camera. Please upload an image.');
            }
        }

        checkCamera();
    }, []);

    const processImage = async (imageSrc: string) => {
        setScanning(true);
        setStatus('Analyzing card features...');
        setSearchResults([]);
        setOcrText('');

        try {
            // Extract base64 data
            const base64Data = imageSrc.split(',')[1];

            setStatus('Detecting border and frame...');

            // Call new recognition command
            const result = await invoke<RecognitionResult>(
                'recognize_card_with_features',
                { imageData: base64Data }
            );

            // Update UI with results
            setOcrText(result.feature_description);
            setSearchResults(result.candidates.slice(0, 5));

            console.log('Detected features:', result.features);
            console.log('Search query:', result.search_query);

            if (result.candidates && result.candidates.length > 0) {
                setStatus(`Found ${result.candidates.length} matches`);
            } else {
                setStatus('No matches found. Try adjusting the image.');
            }

        } catch (error) {
            console.error('Recognition error:', error);
            setStatus('Error during recognition');
        } finally {
            setScanning(false);
        }
    };

    const capture = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;
        await processImage(imageSrc);
    }, [webcamRef]);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Read file as data URL
        const reader = new FileReader();
        reader.onload = async (e) => {
            const imageSrc = e.target?.result as string;
            if (imageSrc) {
                await processImage(imageSrc);
            }
        };
        reader.readAsDataURL(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium text-gray-900">Card Scanner (Experimental)</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Mode selector - only show if camera is available */}
                    {cameraAvailable && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setScanMode('camera')}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scanMode === 'camera'
                                    ? 'bg-accent-blue text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                📷 Camera
                            </button>
                            <button
                                onClick={() => setScanMode('file')}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scanMode === 'file'
                                    ? 'bg-accent-blue text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                📁 Upload File
                            </button>
                        </div>
                    )}

                    {/* Camera error message */}
                    {cameraError && (
                        <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                            ⚠️ {cameraError}
                        </div>
                    )}
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Camera or File Upload */}
                    <div className="w-1/2 bg-black flex flex-col items-center justify-center relative">
                        {scanMode === 'camera' && cameraAvailable ? (
                            <>
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="w-full h-full object-contain"
                                    videoConstraints={{ facingMode: "environment" }}
                                />
                                <div className="absolute bottom-6">
                                    <button
                                        onClick={capture}
                                        disabled={scanning}
                                        aria-label="Capture and Scan"
                                        className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-red-500" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-white">
                                <svg className="w-24 h-24 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <h4 className="text-lg font-medium mb-2">Upload Card Image</h4>
                                <p className="text-sm text-gray-400 mb-6 text-center max-w-xs">
                                    Select an image of a Magic card to scan and identify
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="card-image-upload"
                                    disabled={scanning}
                                />
                                <label
                                    htmlFor="card-image-upload"
                                    className={`px-6 py-3 bg-accent-blue text-white rounded-lg font-medium cursor-pointer transition-colors ${scanning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                                        }`}
                                >
                                    📁 Choose Image
                                </label>
                            </div>
                        )}
                        {scanning && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">
                                {status}
                            </div>
                        )}
                    </div>

                    {/* Right: Results */}
                    <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto">
                        <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                            <p className="text-sm text-gray-600 bg-white p-2 rounded border">{status}</p>
                        </div>

                        {ocrText && (
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Detected Features</h4>
                                <p className="text-xs text-gray-500 bg-white p-2 rounded border max-h-20 overflow-y-auto">
                                    {ocrText}
                                </p>
                            </div>
                        )}

                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Results</h4>
                            <div className="space-y-2">
                                {searchResults.map(card => (
                                    <div
                                        key={card.id}
                                        className={`flex items-center p-2 rounded cursor-pointer border ${selectedCard?.id === card.id
                                            ? 'bg-blue-50 border-blue-500'
                                            : 'bg-white border-gray-200 hover:border-blue-300'
                                            }`}
                                        onClick={() => setSelectedCard(card)}
                                    >
                                        <img
                                            src={card.image_uris?.small}
                                            alt={card.name}
                                            className="w-12 h-16 object-cover rounded mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-medium text-sm text-gray-900">{card.name}</p>
                                                {card.similarity !== undefined && card.similarity < 10 && (
                                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">
                                                        Match
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {card.set_name} • #{card.collector_number}
                                            </p>
                                            {card.similarity !== undefined && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Visual diff: {card.similarity}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {searchResults.length === 0 && !scanning && (
                                    <p className="text-sm text-gray-500 text-center py-8">
                                        Scan a card to see results
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedCard && (
                <CardDetailsModal
                    card={selectedCard}
                    mode="add"
                    onClose={() => setSelectedCard(null)}
                    onCardAdded={() => {
                        setSelectedCard(null);
                        onCardAdded();
                    }}
                />
            )}
        </div>
    );
}

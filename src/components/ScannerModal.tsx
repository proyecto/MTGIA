import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import { invoke } from '@tauri-apps/api/core';
import { ScryfallCardList, ScryfallCard } from '../types';
import CardDetailsModal from './CardDetailsModal';

interface ScannerModalProps {
    onClose: () => void;
    onCardAdded: () => void;
}

export default function ScannerModal({ onClose, onCardAdded }: ScannerModalProps) {
    const webcamRef = useRef<Webcam>(null);
    const [scanning, setScanning] = useState(false);
    const [ocrText, setOcrText] = useState('');
    const [searchResults, setSearchResults] = useState<ScryfallCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
    const [status, setStatus] = useState('Ready to scan');

    const capture = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        setScanning(true);
        setStatus('Processing image...');
        setSearchResults([]);
        setOcrText('');

        try {
            setStatus('Recognizing text...');
            const { data: { text } } = await Tesseract.recognize(
                imageSrc,
                'eng',
                { logger: m => console.log(m) }
            );

            setOcrText(text);
            setStatus('Searching Scryfall...');

            // Clean text: keep only letters and spaces, remove short words
            const cleanText = text
                .replace(/[^a-zA-Z\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 2)
                .join(' ')
                .trim();

            if (!cleanText) {
                setStatus('No readable text found.');
                setScanning(false);
                return;
            }

            console.log('Searching for:', cleanText);
            const results = await invoke<ScryfallCardList>('search_scryfall', {
                query: cleanText,
                page: 1
            });

            if (results.data && results.data.length > 0) {
                setSearchResults(results.data.slice(0, 5)); // Top 5
                setStatus(`Found ${results.data.length} matches.`);
            } else {
                setStatus('No matches found.');
            }

        } catch (error) {
            console.error('Scan error:', error);
            setStatus('Error during scan.');
        } finally {
            setScanning(false);
        }
    }, [webcamRef]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Card Scanner (Experimental)</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Camera */}
                    <div className="w-1/2 bg-black flex flex-col items-center justify-center relative">
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
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Detected Text</h4>
                                <p className="text-xs text-gray-500 bg-white p-2 rounded border max-h-20 overflow-y-auto font-mono">
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
                                        onClick={() => setSelectedCard(card)}
                                        className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200 hover:border-accent-blue cursor-pointer transition-colors"
                                    >
                                        {card.image_uris?.small ? (
                                            <img src={card.image_uris.small} alt={card.name} className="w-12 h-16 object-cover rounded" />
                                        ) : (
                                            <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">No Img</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{card.name}</p>
                                            <p className="text-xs text-gray-500">{card.set_name} #{card.collector_number}</p>
                                        </div>
                                        <button className="text-accent-blue hover:text-blue-700 text-sm font-medium">
                                            Select
                                        </button>
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

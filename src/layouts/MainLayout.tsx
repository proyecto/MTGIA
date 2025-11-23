import { ReactNode, useState } from 'react';
import Sidebar from '../components/Sidebar';
import SearchModal from '../components/SearchModal';

interface MainLayoutProps {
    children: ReactNode;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
}

export default function MainLayout({ children, activeTab, onTabChange }: MainLayoutProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <div className="flex h-screen bg-app-bg text-text-primary font-sans overflow-hidden relative">
            <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
            <main className="flex-1 overflow-auto p-8 relative">
                {children}

                {/* Floating Action Button for Add Card */}
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-accent-blue text-white rounded-full shadow-lg hover:bg-blue-600 transition-all hover:scale-105 flex items-center justify-center z-40"
                    title="Add Card"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </main>

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onCardAdded={() => {
                    setIsSearchOpen(false);
                    window.location.reload();
                }}
            />
        </div>
    );
}

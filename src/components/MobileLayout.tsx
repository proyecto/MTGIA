import React from 'react';
import { usePlatform } from '../utils/usePlatform';

interface MobileLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onSearchClick: () => void;
}

/**
 * Mobile-optimized layout inspired by Things 3 iOS
 */
export function MobileLayout({ children, activeTab, onTabChange, onSearchClick }: MobileLayoutProps) {
    const { isMobile } = usePlatform();

    if (!isMobile) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col h-screen bg-[#F2F2F7] dark:bg-black text-gray-900 dark:text-white overflow-hidden">
            {/* Safe area top background */}
            <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-[#F2F2F7] dark:bg-black z-50" />

            {/* Main content area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden safe-area-top pb-24 px-4">
                <div className="pt-4">
                    {children}
                </div>
            </main>

            {/* Floating Action Button (Magic Plus) */}
            <div className="fixed bottom-24 right-4 z-40">
                <button
                    className="w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white active:scale-90 transition-transform duration-200"
                    onClick={onSearchClick}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>

            {/* Bottom Navigation with Blur Effect */}
            <nav className="fixed bottom-0 left-0 right-0 ios-blur border-t border-gray-200/50 dark:border-gray-800/50 safe-area-bottom z-50">
                <div className="flex justify-around items-center h-[49px] pb-1">
                    <NavButton
                        active={activeTab === 'decks'}
                        onClick={() => onTabChange('decks')}
                        label="Inicio"
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill={activeTab === 'decks' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                        }
                    />
                    <NavButton
                        active={activeTab === 'collection'}
                        onClick={() => onTabChange('collection')}
                        label="Colección"
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill={activeTab === 'collection' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                        }
                    />
                    <NavButton
                        active={false}
                        onClick={onSearchClick}
                        label="Buscar"
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        }
                    />
                    <NavButton
                        active={activeTab === 'settings'}
                        onClick={() => onTabChange('settings')}
                        label="Ajustes"
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill={activeTab === 'settings' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        }
                    />
                </div>
            </nav>
        </div>
    );
}

interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active: boolean;
}

function NavButton({ icon, label, onClick, active }: NavButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-full h-full pt-1 transition-colors ${active ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                }`}
        >
            <div className="mb-[2px]">
                {icon}
            </div>
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
        </button>
    );
}

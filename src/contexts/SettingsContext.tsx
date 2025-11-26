import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Currency = 'USD' | 'EUR';

/**
 * Context interface for global application settings.
 */
interface SettingsContextType {
    /** Current currency preference (USD or EUR) */
    currency: Currency;
    /** Function to update the currency preference */
    setCurrency: (c: Currency) => void;
    /** Helper function to format prices based on the selected currency */
    formatPrice: (price: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Provider component for application settings.
 * Manages persistence of settings (like currency) to localStorage.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState<Currency>(() => {
        const saved = localStorage.getItem('currency');
        return (saved as Currency) || 'EUR'; // Default to EUR as requested
    });

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(currency === 'EUR' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    return (
        <SettingsContext.Provider value={{ currency, setCurrency, formatPrice }}>
            {children}
        </SettingsContext.Provider>
    );
}

/**
 * Hook to access the settings context.
 * @throws Error if used outside of a SettingsProvider
 */
export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

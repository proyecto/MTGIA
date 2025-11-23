import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Currency = 'USD' | 'EUR';

interface SettingsContextType {
    currency: Currency;
    setCurrency: (c: Currency) => void;
    formatPrice: (price: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

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

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

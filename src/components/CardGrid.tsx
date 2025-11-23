import { ReactNode } from 'react';

interface CardGridProps {
    children: ReactNode;
}

export default function CardGrid({ children }: CardGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {children}
        </div>
    );
}

import { CollectionCard } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface CardItemProps extends CollectionCard {
    onClick?: () => void;
}

export default function CardItem({
    name,
    image_uri,
    set_code,
    condition,
    current_price,
    quantity,
    is_foil,
    onClick
}: CardItemProps) {
    const { formatPrice } = useSettings();

    return (
        <div
            className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 overflow-hidden"
            onClick={onClick}
        >
            <div className="aspect-[2.5/3.5] bg-gray-100 relative overflow-hidden">
                {image_uri ? (
                    <img
                        src={image_uri}
                        alt={name}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}
                {is_foil && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-300 to-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        FOIL
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white font-bold text-sm">{formatPrice(current_price)}</p>
                </div>
            </div>

            <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm truncate" title={name}>{name}</h3>
                <div className="flex justify-between items-center mt-1">
                    <div className="flex gap-2 text-xs text-gray-500">
                        <span className="uppercase font-mono bg-gray-100 px-1 rounded">{set_code}</span>
                        <span>{condition}</span>
                    </div>
                    <div className="text-xs font-medium text-gray-400">
                        x{quantity}
                    </div>
                </div>
            </div>
        </div>
    );
}

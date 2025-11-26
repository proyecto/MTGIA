import { CollectionCard } from '../types';
import { useSettings } from '../contexts/SettingsContext';

/**
 * Props for the CardItem component.
 * Extends CollectionCard to include event handlers.
 */
interface CardItemProps extends CollectionCard {
    /** Callback when the card is clicked */
    onClick?: () => void;
    /** Callback when the edit button is clicked */
    onEdit?: () => void;
    /** Callback when the delete button is clicked */
    onDelete?: () => void;
}

/**
 * Displays a single card in the collection grid.
 * Shows the card image, details, and action buttons on hover.
 */
export default function CardItem({
    name,
    image_uri,
    set_code,
    condition,
    current_price,
    quantity,
    is_foil,
    language,
    onClick,
    onEdit,
    onDelete
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
                        {language && language !== 'English' && (
                            <span className="bg-blue-100 text-blue-700 px-1 rounded" title={`Language: ${language}`}>
                                {language === 'Spanish' ? '🇪🇸' :
                                    language === 'Japanese' ? '🇯🇵' :
                                        language === 'German' ? '🇩🇪' :
                                            language === 'French' ? '🇫🇷' :
                                                language === 'Italian' ? '🇮🇹' :
                                                    language === 'Portuguese' ? '🇵🇹' :
                                                        language === 'Russian' ? '🇷🇺' :
                                                            language === 'Korean' ? '🇰🇷' :
                                                                language === 'Chinese Simplified' ? '🇨🇳' :
                                                                    language === 'Chinese Traditional' ? '🇹🇼' : '🌐'}
                            </span>
                        )}
                    </div>
                    <div className="text-xs font-medium text-gray-400">
                        x{quantity}
                    </div>
                </div>

                {/* Action buttons - shown on hover */}
                {(onEdit || onDelete) && (
                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEdit();
                                }}
                                type="button"
                                className="flex-1 text-xs px-2 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors font-medium"
                            >
                                ✏️ Edit
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                type="button"
                                className="flex-1 text-xs px-2 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors font-medium"
                            >
                                🗑️ Delete
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

import { getFinishesByCategory } from '../utils/cardFinishes';

interface FinishSelectorProps {
    value: string;
    onChange: (value: string) => void;
    id?: string;
    className?: string;
}

export default function FinishSelector({ value, onChange, id, className }: FinishSelectorProps) {
    const finishesByCategory = getFinishesByCategory();

    return (
        <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={className || "w-full rounded-md border-gray-300 shadow-sm focus:border-accent-blue focus:ring focus:ring-accent-blue focus:ring-opacity-50 p-2 border"}
        >
            {Object.entries(finishesByCategory).map(([category, finishes]) => (
                <optgroup key={category} label={category}>
                    {finishes.map(({ value: finishValue, label, icon }) => (
                        <option key={finishValue} value={finishValue}>
                            {icon} {label}
                        </option>
                    ))}
                </optgroup>
            ))}
        </select>
    );
}

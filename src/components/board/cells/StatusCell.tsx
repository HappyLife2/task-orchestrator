import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface StatusCellProps {
    value: string;
    onChange: (value: string) => void;
    settings: {
        labels: Record<string, string>; // label -> color
    };
}

export const StatusCell: React.FC<StatusCellProps> = ({ value, onChange, settings }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Default to gray if not found
    const statusColor = settings.labels?.[value?.toLowerCase()] || '#c4c4c4';
    const statusLabel = value ? (value.charAt(0).toUpperCase() + value.slice(1)) : 'Default';

    return (
        <div className="relative w-full h-full p-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-full rounded-md text-white font-medium text-sm transition-opacity hover:opacity-90 flex items-center justify-center"
                style={{ backgroundColor: statusColor }}
            >
                {statusLabel}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-40 bg-[#1a1b4b] border border-[#2c2d65] rounded-lg shadow-xl z-50 overflow-hidden">
                        {Object.entries(settings.labels || {}).map(([label, color]) => (
                            <button
                                key={label}
                                onClick={() => {
                                    onChange(label);
                                    setIsOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-[#2c2d65] transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                                    <span className="text-sm text-gray-200 capitalize group-hover:text-white">
                                        {label}
                                    </span>
                                </div>
                                {value?.toLowerCase() === label.toLowerCase() && (
                                    <Check size={14} className="text-[#e0592a]" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

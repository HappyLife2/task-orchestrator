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
        <div className="relative w-full h-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-full text-white text-[13px] font-normal transition-opacity flex items-center justify-center m-0 outline-none relative overflow-hidden group/btn"
                style={{
                    background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}cc 50%, ${statusColor}99 100%)`,
                    borderTop: `1px solid ${statusColor}80`
                }}
            >
                <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-[0.15] transition-opacity" />
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
                                className="w-full px-3 py-2 text-left transition-colors flex items-center justify-between group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${color}33 0%, transparent 100%)` }} />
                                <div className="flex items-center gap-2 relative z-10">
                                    <div className="w-3 h-3 rounded-sm border border-black/20" style={{ backgroundColor: color }} />
                                    <span className="text-sm text-gray-200 capitalize group-hover:text-white transition-colors">
                                        {label}
                                    </span>
                                </div>
                                {value?.toLowerCase() === label.toLowerCase() && (
                                    <Check size={14} className="text-white relative z-10" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface Option {
    label: string;
    value: string;
    color?: string;
}

interface DropdownCellProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
}

export const DropdownCell: React.FC<DropdownCellProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Select...'
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Find the currently selected option to get its color & label
    const selectedOption = options.find(opt => opt.value === value);
    const bgColor = selectedOption?.color || 'transparent';
    const displayLabel = selectedOption ? selectedOption.label : '';

    return (
        <div className="relative w-full h-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-full text-white text-[13px] font-normal transition-opacity flex items-center justify-center m-0 outline-none relative overflow-hidden group/btn"
                style={{
                    background: selectedOption ? `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}cc 50%, ${bgColor}99 100%)` : 'transparent',
                    borderTop: selectedOption ? `1px solid ${bgColor}80` : undefined
                }}
            >
                {selectedOption && <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-[0.15] transition-opacity" />}
                {displayLabel}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-40 bg-[#1a1b4b] border border-[#2c2d65] rounded-lg shadow-xl z-50 overflow-hidden">
                        {options.map((opt) => {
                            const optColor = opt.color || '#c4c4c4';
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-3 py-2 text-left transition-colors flex items-center justify-between group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${optColor}33 0%, transparent 100%)` }} />
                                    <div className="flex items-center gap-2 relative z-10">
                                        {opt.color && (
                                            <div className="w-3 h-3 rounded-sm border border-black/20" style={{ backgroundColor: optColor }} />
                                        )}
                                        <span className="text-sm text-gray-200 capitalize group-hover:text-white transition-colors">
                                            {opt.label}
                                        </span>
                                    </div>
                                    {value === opt.value && (
                                        <Check size={14} className="text-white relative z-10" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

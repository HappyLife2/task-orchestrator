import React, { useState, useEffect } from 'react';

interface TextCellProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const TextCell: React.FC<TextCellProps> = ({ value, onChange, placeholder }) => {
    const [inputValue, setInputValue] = useState(value || '');

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    return (
        <div className="w-full h-full flex items-center px-1">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={() => {
                    if (inputValue !== value) {
                        onChange(inputValue);
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                    }
                }}
                placeholder={placeholder}
                className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 focus:bg-[#1a1b4b] rounded px-2 py-1 transition-colors"
                spellCheck={false}
            />
        </div>
    );
};

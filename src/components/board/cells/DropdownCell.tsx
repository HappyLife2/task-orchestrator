import React from 'react';
import { Dropdown } from '@vibe/core';

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
    // Find the currently selected option to get its color
    const selectedOption = options.find(opt => opt.value === value);
    const bgColor = selectedOption?.color || 'transparent';

    return (
        <div className="relative w-full h-full" style={{ backgroundColor: bgColor }}>
            <Dropdown
                options={options.map(opt => ({
                    label: opt.label,
                    value: opt.value,
                    leftAvatar: opt.color ? (
                        <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: opt.color }} />
                    ) : undefined
                }))}
                value={value}
                onChange={(option: { value: string } | null) => onChange(option?.value ?? '')}
                placeholder={placeholder}
                size="small"
                className="w-full h-full [&_.dropdown-wrapper]:h-full [&_.dropdown-wrapper]:!border-none [&_.dropdown-wrapper]:!bg-transparent [&_input]:!text-white"
            />
        </div>
    );
};

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
    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-full px-1">
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
                    className="w-full"
                />
            </div>
        </div>
    );
};

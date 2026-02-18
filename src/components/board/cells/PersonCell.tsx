import React from 'react';
import { Dropdown } from '@vibe/core';

interface Employee {
    id: string;
    name: string;
}

interface PersonCellProps {
    value: string | null; // userId
    onChange: (value: string | null) => void;
    employees: Employee[];
}

export const PersonCell: React.FC<PersonCellProps> = ({ value, onChange, employees }) => {
    const personOptions = [
        { value: '___unassign', label: 'Unassign', leftAvatar: null },
        ...employees.map(emp => ({
            value: emp.id,
            label: emp.name,
            leftAvatar: emp.name.charAt(0).toUpperCase()
        }))
    ];

    return (
        <div className="w-full px-1">
            <Dropdown
                placeholder="Select person"
                options={personOptions}
                value={value || undefined}
                onChange={(option: { value: string } | null) => {
                    if (option?.value === '___unassign') {
                        onChange(null);
                    } else {
                        onChange(option?.value ?? null);
                    }
                }}
                size="small"
                className="w-full"
            />
        </div>
    );
};

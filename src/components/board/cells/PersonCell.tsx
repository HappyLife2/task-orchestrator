import React, { useState, useRef } from 'react';
import { PortalMenu } from '../../PortalMenu';
import { User, X } from 'lucide-react';

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
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    const selectedEmployee = employees.find(e => e.id === value);
    const initials = selectedEmployee ? selectedEmployee.name.charAt(0).toUpperCase() : '';

    return (
        <div className="w-full h-full flex items-center justify-center relative p-1">
            <div
                ref={triggerRef}
                onClick={() => setOpen(true)}
                className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${selectedEmployee ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'border border-dashed border-gray-500 text-gray-400 hover:text-white hover:border-white'}`}
                title={selectedEmployee ? selectedEmployee.name : 'Assign person'}
            >
                {selectedEmployee ? (
                    <span className="text-[11px] font-semibold">{initials}</span>
                ) : (
                    <User size={14} />
                )}
            </div>

            {open && (
                <PortalMenu triggerRef={triggerRef} onClose={() => setOpen(false)} width={220}>
                    <div className="bg-[#1a1b4b] border border-[#2c2d65] shadow-2xl rounded-lg py-1 overflow-hidden">
                        <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#2c2d65] bg-[#1a1b4b]">
                            Suggested People
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {employees.map(emp => (
                                <div
                                    key={emp.id}
                                    onClick={() => { onChange(emp.id); setOpen(false); }}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-[#2c2d65] cursor-pointer transition-colors group"
                                >
                                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                                        {emp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm text-gray-200 group-hover:text-white truncate">
                                        {emp.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {value && (
                            <div
                                onClick={() => { onChange(null); setOpen(false); }}
                                className="flex items-center gap-2 px-3 py-2 mt-1 border-t border-[#2c2d65] hover:bg-red-500/10 cursor-pointer transition-colors group text-red-400"
                            >
                                <X size={14} />
                                <span className="text-sm">Remove assignee</span>
                            </div>
                        )}
                    </div>
                </PortalMenu>
            )}
        </div>
    );
};

import React, { useState, useRef } from 'react';
import { PortalMenu } from '../../PortalMenu';
import { User, X, Check } from 'lucide-react';

interface Employee {
    id: string;
    name: string;
    position?: string;
}

interface PersonCellProps {
    value: string[]; // array of userIds
    onChange: (value: string[]) => void;
    employees: Employee[];
}

export const PersonCell: React.FC<PersonCellProps> = ({ value = [], onChange, employees }) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    const selectedEmployees = employees.filter(e => value.includes(e.id));

    const toggleEmployee = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter(v => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center relative p-1">
            <div
                ref={triggerRef}
                onClick={() => setOpen(true)}
                className="flex items-center -space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                title={selectedEmployees.length > 0 ? selectedEmployees.map(e => e.name).join(', ') : 'Assign people'}
            >
                {selectedEmployees.length > 0 ? (
                    selectedEmployees.slice(0, 3).map((emp, i) => (
                        <div
                            key={emp.id}
                            className="w-7 h-7 rounded-full bg-blue-600 border-2 border-[#1a1b4b] flex items-center justify-center text-white shadow-sm"
                            style={{ zIndex: selectedEmployees.length - i }}
                        >
                            <span className="text-[10px] font-bold">{emp.name.charAt(0).toUpperCase()}</span>
                        </div>
                    ))
                ) : (
                    <div className="w-7 h-7 rounded-full border border-dashed border-gray-500 text-gray-400 flex items-center justify-center hover:text-white hover:border-white transition-colors">
                        <User size={14} />
                    </div>
                )}
                {selectedEmployees.length > 3 && (
                    <div className="w-7 h-7 rounded-full bg-gray-700 border-2 border-[#1a1b4b] flex items-center justify-center text-white text-[10px] font-bold z-0">
                        +{selectedEmployees.length - 3}
                    </div>
                )}
            </div>

            {open && (
                <PortalMenu triggerRef={triggerRef} onClose={() => setOpen(false)} width={220}>
                    <div className="bg-[#1a1b4b] border border-[#2c2d65] shadow-2xl rounded-lg py-1 overflow-hidden">
                        <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#2c2d65] bg-[#1a1b4b]">
                            Team Members
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {employees.map(emp => {
                                const isSelected = value.includes(emp.id);
                                return (
                                    <div
                                        key={emp.id}
                                        onClick={() => toggleEmployee(emp.id)}
                                        className="flex items-center gap-2 px-3 py-2 hover:bg-[#2c2d65] cursor-pointer transition-colors group"
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                            {emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className={`text-sm truncate ${isSelected ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                {emp.name}
                                            </span>
                                        </div>
                                        {isSelected && <Check size={14} className="text-blue-400" />}
                                    </div>
                                );
                            })}
                        </div>
                        {value.length > 0 && (
                            <div
                                onClick={() => { onChange([]); setOpen(false); }}
                                className="flex items-center gap-2 px-3 py-2 mt-1 border-t border-[#2c2d65] hover:bg-red-500/10 cursor-pointer transition-colors group text-red-400"
                            >
                                <X size={14} />
                                <span className="text-sm">Clear all</span>
                            </div>
                        )}
                    </div>
                </PortalMenu>
            )}
        </div>
    );
};

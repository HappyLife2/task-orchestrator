import React from 'react';

interface TimelineCellProps {
    value: string; // Stored as "YYYY-MM-DD/YYYY-MM-DD" or similar
    onChange: (value: string) => void;
}

export const TimelineCell: React.FC<TimelineCellProps> = ({ value, onChange }) => {
    return (
        <div className="w-full h-full flex items-center justify-center p-1">
            <div className="w-full h-8 bg-[#1a1b4b] rounded-full flex items-center justify-center group relative overflow-hidden">
                {/* Visual representation - ProgressBar style */}
                <div className="absolute inset-0 bg-[#33345c] rounded-full" />
                <div
                    className="absolute left-0 top-0 bottom-0 bg-[#e0592a] opacity-50 rounded-full"
                    style={{ width: '60%' }} // Mock progress
                />

                <span className="relative z-10 text-xs font-medium text-white px-2 truncate">
                    {value || 'Set Dates'}
                </span>

                {/* Hidden Date Input (Native) for simple selection */}
                <input
                    type="date"
                    onChange={(e) => {
                        if (e.target.value) onChange(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
            </div>
        </div>
    );
};

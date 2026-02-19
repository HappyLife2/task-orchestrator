'use client';

import React, { useState, useRef } from 'react';
import { DialogContentContainer } from '@vibe/core';
import { DatePicker } from '@vibe/core/next';
import moment from 'moment';
import { PortalMenu } from '../../PortalMenu';



interface TimelineCellProps {
    value: string; // "YYYY-MM-DD - YYYY-MM-DD"
    onChange: (value: string) => void;
}

export const TimelineCell: React.FC<TimelineCellProps> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Parse value strings into Date objects
    // Value format: "YYYY-MM-DD - YYYY-MM-DD"
    const [startStr, endStr] = value ? value.split(' - ') : [];

    // Create Date objects (using new Date since @vibe/core/next uses native Dates)
    // We append time to ensure local date isn't shifted by timezone if parsing ISO date-only strings
    // Actually, new Date("YYYY-MM-DD") is UTC in some browsers, local in others.
    // Recommended to use moment to parse, then .toDate()
    const startDate = startStr && moment(startStr).isValid() ? moment(startStr).toDate() : undefined;
    const endDate = endStr && moment(endStr).isValid() ? moment(endStr).toDate() : undefined;

    // Define the expected range object structure from @vibe/core/next DatePicker
    interface DatePickerRange {
        date?: Date;
        endDate?: Date;
    }

    const handleDateChange = (range: DatePickerRange) => {
        // Range object from Vibe Next DatePicker with mode="range"
        // It provides { date: Date, endDate: Date }

        const { date: sDate, endDate: eDate } = range;

        if (sDate && eDate) {
            const s = moment(sDate);
            const e = moment(eDate);
            const newVal = `${s.format('YYYY-MM-DD')} - ${e.format('YYYY-MM-DD')}`;
            onChange(newVal);
        } else if (sDate) {
            const s = moment(sDate);
            // Partial selection? We can update just the start, or wait. 
            // To be consistent with "Set Dates", let's update.
            // But usually ranges need both.
            // If we update with only start, the end is invalid/empty.
            // We'll update the value string to just start?
            // Or we wait for both. 
            // The user code was: setDate({ start: range.date, end: range.endDate })
            // This implies local state update. 
            // Since we are controlled by 'value' prop, we should probably ONLY call onChange when we have a valid range?
            // Or at least valid start.
            const newVal = `${s.format('YYYY-MM-DD')}`; // Temporary?
            // Actually, let's wait for endDate effectively?
            // No, updating onChange causes parent to save.
            // If I save "2023-01-01", next render parsing " - " might fail or result in start only.
            // My parsing logic handles start only.
            onChange(newVal);
        }
    };

    const displayValue = () => {
        if (startDate && endDate) {
            const startFmt = moment(startDate).format('MMM D');
            const endFmt = moment(endDate).format('MMM D');
            if (startFmt === endFmt) return startFmt;
            return `${startFmt} - ${endFmt}`;
        }
        if (startDate) return moment(startDate).format('MMM D');
        return '';
    };

    const hasDates = !!(startDate || endDate);

    return (
        <div className="w-full h-full flex items-center justify-center relative group">
            <div
                ref={triggerRef}
                onClick={() => setOpen(true)}
                className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-100/10 transition-colors"
            >
                <span className={`text-[13px] truncate ${hasDates ? 'text-white' : 'text-gray-500'}`}>
                    {displayValue() || <span className="opacity-0 group-hover:opacity-100 text-gray-400 text-xs">Set Dates</span>}
                </span>
            </div>

            {open && (
                <PortalMenu triggerRef={triggerRef} onClose={() => setOpen(false)} width={320}>
                    <DialogContentContainer>
                        <DatePicker
                            id="date-range-picker"
                            mode="range"
                            date={startDate}
                            endDate={endDate}
                            onDateChange={handleDateChange}
                        />
                    </DialogContentContainer>
                </PortalMenu>
            )}
        </div>
    );
};

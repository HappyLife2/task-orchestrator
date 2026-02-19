'use client';

import React, { useState, useRef } from 'react';
import { DatePicker, DialogContentContainer } from '@vibe/core';
import "@vibe/core/dist/components/DatePicker/external_datepicker.scss";
import moment, { Moment } from 'moment';
import { PortalMenu } from '../../PortalMenu';

interface RangeDate {
    startDate: Moment | null;
    endDate: Moment | null;
}
import { Calendar } from 'lucide-react';

interface TimelineCellProps {
    value: string; // "YYYY-MM-DD - YYYY-MM-DD"
    onChange: (value: string) => void;
}

export const TimelineCell: React.FC<TimelineCellProps> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Parse value
    const [startStr, endStr] = value ? value.split(' - ') : [];

    // Ensure we don't default to 'now' for empty strings
    const startDate = startStr && moment(startStr).isValid() ? moment(startStr) : undefined;
    const endDate = endStr && moment(endStr).isValid() ? moment(endStr) : undefined;

    const handlePickDate = (dateOrRange: Moment | { startDate: Moment | null, endDate: Moment | null }) => {
        if (!dateOrRange) return;

        let s: Moment | null | undefined;
        let e: Moment | null | undefined;

        // Check if it's a range object
        if ('startDate' in dateOrRange) {
            s = dateOrRange.startDate;
            e = dateOrRange.endDate;
        } else {
            // Single date
            s = dateOrRange as Moment;
            e = null;
        }

        if (s && e) {
            // Full range selected
            const newVal = `${s.format('YYYY-MM-DD')} - ${e.format('YYYY-MM-DD')}`;
            onChange(newVal);
            setOpen(false); // Close on selection completion
        } else if (s) {
            // Start date selected - partial update if needed or just handle internally by DatePicker
            // Since this is a cell, we might not want to save incomplete data.
            // But visually, DatePicker handles it if we pass startDate without endDate.
            // However, DatePicker is controlled. So we MUST update the props passed to it.
            // We'll update state locally? No, cell is controlled.
            // Let's commit start date only
            const newVal = `${s.format('YYYY-MM-DD')}`;
            onChange(newVal);
        }
    };

    const displayValue = () => {
        if (startDate && endDate) {
            const startFmt = startDate.format('MMM D');
            const endFmt = endDate.format('MMM D');
            if (startFmt === endFmt) return startFmt;
            return `${startFmt} - ${endFmt}`;
        }
        if (startDate) return startDate.format('MMM D');
        return '';
    };

    const hasDates = !!(startDate || endDate);

    // Simplified Visual: Just the text, centered. Hover effect for cell.
    // Mimic standard Monday date cell: Text in middle. Background darken on hover.

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

                {/* Hidden Calendar Icon on Hover for empty state or if desired */}
                {/* But simplest is just text. */}
            </div>

            {open && (
                <PortalMenu triggerRef={triggerRef} onClose={() => setOpen(false)} width={320}>
                    <DialogContentContainer>
                        <DatePicker
                            range
                            date={startDate}
                            endDate={endDate}
                            onPickDate={handlePickDate}
                            numberOfMonths={1}
                        />
                    </DialogContentContainer>
                </PortalMenu>
            )}
        </div>
    );
};

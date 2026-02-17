'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task, BoardColumn } from '@/lib/types';

interface CalendarViewProps {
    tasks: Task[];
    columns: BoardColumn[];
    dateColumnId: string;
    onTaskClick?: (task: Task) => void;
    renderTaskPreview?: (task: Task) => React.ReactNode;
}

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarView({
    tasks,
    columns,
    dateColumnId,
    onTaskClick,
    renderTaskPreview
}: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');

    const { startDate, endDate, days } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Get first day of month and adjust to start on Sunday
        const firstDay = new Date(year, month, 1);
        const startDay = new Date(firstDay);
        startDay.setDate(startDay.getDate() - startDay.getDay());

        // Get last day and adjust to end on Saturday
        const lastDay = new Date(year, month + 1, 0);
        const endDay = new Date(lastDay);
        endDay.setDate(endDay.getDate() + (6 - endDay.getDay()));

        // Generate all days
        const dayArray: Date[] = [];
        const current = new Date(startDay);
        while (current <= endDay) {
            dayArray.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return {
            startDate: startDay,
            endDate: endDay,
            days: dayArray
        };
    }, [currentDate]);

    // Group tasks by date
    const tasksByDate = useMemo(() => {
        const grouped: Record<string, Task[]> = {};

        tasks.forEach(task => {
            const dateValue = task.parsedValues[dateColumnId];
            if (dateValue) {
                const taskDate = new Date(dateValue);
                const dateKey = taskDate.toISOString().split('T')[0];
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(task);
            }
        });

        return grouped;
    }, [tasks, dateColumnId]);

    const navigateMonth = (direction: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + direction);
            return newDate;
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    const defaultTaskPreview = (task: Task) => (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onTaskClick?.(task);
            }}
            className="text-xs bg-[#e0592a] text-white px-2 py-1 rounded mb-1 truncate cursor-pointer hover:bg-[#c94e23] transition-colors"
            title={task.name}
        >
            {task.name}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#0f102a]">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2c2d65]">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 bg-[#1a1b4b] hover:bg-[#2c2d65] text-white rounded-lg transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-4 py-2 bg-[#1a1b4b] hover:bg-[#2c2d65] text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 bg-[#1a1b4b] hover:bg-[#2c2d65] text-white rounded-lg transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* View Mode Selector */}
                <div className="flex gap-2 bg-[#1a1b4b] rounded-lg p-1">
                    {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === mode
                                    ? 'bg-[#e0592a] text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 p-4">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-semibold text-gray-400 uppercase py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2 auto-rows-fr">
                    {days.map((date, index) => {
                        const dateKey = date.toISOString().split('T')[0];
                        const dayTasks = tasksByDate[dateKey] || [];
                        const today = isToday(date);
                        const currentMonth = isCurrentMonth(date);

                        return (
                            <div
                                key={index}
                                className={`min-h-[120px] p-2 rounded-lg border transition-colors ${today
                                        ? 'bg-[#1a1b4b] border-[#e0592a]'
                                        : currentMonth
                                            ? 'bg-[#1a1b4b] border-[#2c2d65] hover:border-[#3c3d75]'
                                            : 'bg-[#0f102a] border-[#1a1b4b]'
                                    }`}
                            >
                                <div className={`text-sm font-medium mb-2 ${today
                                        ? 'text-[#e0592a]'
                                        : currentMonth
                                            ? 'text-white'
                                            : 'text-gray-600'
                                    }`}>
                                    {date.getDate()}
                                </div>

                                <div className="space-y-1 overflow-y-auto max-h-[80px]">
                                    {dayTasks.slice(0, 3).map(task => (
                                        <div key={task.id}>
                                            {renderTaskPreview ? renderTaskPreview(task) : defaultTaskPreview(task)}
                                        </div>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <div className="text-xs text-gray-500 px-2">
                                            +{dayTasks.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

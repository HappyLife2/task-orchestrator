'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task, BoardColumn } from '@/lib/types';

interface TimelineViewProps {
    tasks: Task[];
    columns: BoardColumn[];
    startColumnId: string;
    endColumnId?: string;
    onTaskClick?: (task: Task) => void;
}

export default function TimelineView({
    tasks,
    columns,
    startColumnId,
    endColumnId,
    onTaskClick
}: TimelineViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('week');

    // Calculate timeline range
    const { startDate, endDate, periods } = useMemo(() => {
        const start = new Date(currentDate);
        start.setDate(1); // Start of month

        const end = new Date(currentDate);
        end.setMonth(end.getMonth() + 3); // Show 3 months

        const periodArray: Date[] = [];
        const current = new Date(start);

        if (zoom === 'day') {
            while (current <= end) {
                periodArray.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        } else if (zoom === 'week') {
            while (current <= end) {
                periodArray.push(new Date(current));
                current.setDate(current.getDate() + 7);
            }
        } else {
            while (current <= end) {
                periodArray.push(new Date(current));
                current.setMonth(current.getMonth() + 1);
            }
        }

        return { startDate: start, endDate: end, periods: periodArray };
    }, [currentDate, zoom]);

    // Process tasks with timeline data
    const timelineTasks = useMemo(() => {
        return tasks.map(task => {
            const startValue = task.parsedValues[startColumnId];
            const endValue = endColumnId ? task.parsedValues[endColumnId] : null;

            if (!startValue) return null;

            const taskStart = new Date(startValue);
            const taskEnd = endValue ? new Date(endValue) : new Date(taskStart.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 1 week

            // Calculate position and width
            const totalDays = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
            const taskStartDays = (taskStart.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
            const taskDuration = (taskEnd.getTime() - taskStart.getTime()) / (24 * 60 * 60 * 1000);

            const left = (taskStartDays / totalDays) * 100;
            const width = (taskDuration / totalDays) * 100;

            return {
                ...task,
                taskStart,
                taskEnd,
                left: Math.max(0, left),
                width: Math.max(2, Math.min(width, 100 - left))
            };
        }).filter(Boolean) as (Task & { taskStart: Date; taskEnd: Date; left: number; width: number })[];
    }, [tasks, startColumnId, endColumnId, startDate, endDate]);

    const navigate = (direction: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (zoom === 'day') {
                newDate.setDate(newDate.getDate() + (direction * 7));
            } else if (zoom === 'week') {
                newDate.setMonth(newDate.getMonth() + direction);
            } else {
                newDate.setMonth(newDate.getMonth() + (direction * 3));
            }
            return newDate;
        });
    };

    const getStatusColor = (task: Task): string => {
        const statusColumn = columns.find(c => c.type === 'status');
        if (!statusColumn) return '#e0592a';

        const status = task.parsedValues[statusColumn.id];
        const statusKey = typeof status === 'string' ? status.toLowerCase() : 'default';
        return statusColumn.settings?.status?.labels?.[statusKey] || '#e0592a';
    };

    return (
        <div className="flex flex-col h-full bg-[#0f102a] overflow-hidden">
            {/* Timeline Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2c2d65]">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white">Timeline</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(-1)}
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
                            onClick={() => navigate(1)}
                            className="p-2 bg-[#1a1b4b] hover:bg-[#2c2d65] text-white rounded-lg transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex gap-2 bg-[#1a1b4b] rounded-lg p-1">
                    {(['day', 'week', 'month'] as const).map(z => (
                        <button
                            key={z}
                            onClick={() => setZoom(z)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${zoom === z
                                ? 'bg-[#e0592a] text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {z.charAt(0).toUpperCase() + z.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-[1200px]">
                    {/* Period Headers */}
                    <div className="sticky top-0 z-10 bg-[#1a1b4b] border-b border-[#2c2d65]">
                        <div className="flex">
                            <div className="w-64 flex-shrink-0 p-4 border-r border-[#2c2d65]">
                                <span className="text-sm font-semibold text-gray-400 uppercase">Task</span>
                            </div>
                            <div className="flex-1 flex">
                                {periods.map((period, index) => (
                                    <div
                                        key={index}
                                        className="flex-1 p-4 text-center border-r border-[#2c2d65] last:border-r-0"
                                    >
                                        <div className="text-sm font-semibold text-white">
                                            {zoom === 'month'
                                                ? period.toLocaleDateString('en-US', { month: 'short' })
                                                : period.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Timeline Rows */}
                    <div className="relative">
                        {timelineTasks.map((task) => (
                            <div key={task.id} className="flex border-b border-[#2c2d65] hover:bg-[#1a1b4b]/50 transition-colors">
                                {/* Task Name */}
                                <div className="w-64 flex-shrink-0 p-4 border-r border-[#2c2d65]">
                                    <div className="text-sm text-white font-medium truncate">{task.name}</div>
                                    {task.assignedUsers && task.assignedUsers.length > 0 && (
                                        <div className="text-xs text-gray-400 mt-1 truncate">
                                            {task.assignedUsers[0].name}
                                            {task.assignedUsers.length > 1 && ` +${task.assignedUsers.length - 1}`}
                                        </div>
                                    )}
                                </div>

                                {/* Timeline Bar */}
                                <div className="flex-1 relative h-16 py-2">
                                    <div
                                        className="absolute h-10 rounded-lg cursor-pointer hover:brightness-110 transition-all flex items-center px-3 overflow-hidden group"
                                        style={{
                                            left: `${task.left}%`,
                                            width: `${task.width}%`,
                                            backgroundColor: getStatusColor(task),
                                            minWidth: '60px'
                                        }}
                                        onClick={() => onTaskClick?.(task)}
                                    >
                                        <span className="text-xs font-medium text-white truncate">
                                            {task.name}
                                        </span>
                                        <div className="ml-auto text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {Math.round((task.taskEnd.getTime() - task.taskStart.getTime()) / (24 * 60 * 60 * 1000))}d
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {timelineTasks.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No tasks with timeline data found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

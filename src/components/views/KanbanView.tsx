'use client';

import { useMemo } from 'react';
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, BoardColumn } from '@/lib/types';
import { Plus } from 'lucide-react';

interface KanbanViewProps {
    tasks: Task[];
    columns: BoardColumn[];
    statusColumnId: string;
    onTaskMove?: (taskId: string, newStatus: string, newPosition: number) => void;
    onTaskClick?: (task: Task) => void;
    renderTaskCard?: (task: Task) => React.ReactNode;
}

export default function KanbanView({
    tasks,
    columns,
    statusColumnId,
    onTaskMove,
    onTaskClick,
    renderTaskCard
}: KanbanViewProps) {
    // Find the status column
    const statusColumn = columns.find(col => col.id === statusColumnId);
    const statusLabels = statusColumn?.settings?.status?.labels || {};
    const statuses = Object.keys(statusLabels).filter(k => k !== 'default');

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const grouped: Record<string, Task[]> = {};
        statuses.forEach(status => {
            grouped[status] = [];
        });

        tasks.forEach(task => {
            const taskStatus = task.parsedValues[statusColumnId] || 'default';
            const statusKey = typeof taskStatus === 'string' ? taskStatus.toLowerCase() : 'default';
            if (grouped[statusKey]) {
                grouped[statusKey].push(task);
            }
        });

        return grouped;
    }, [tasks, statusColumnId, statuses]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        // Determine new status
        let newStatus = '';
        let newPosition = 0;

        // Check if dropped on a column or another task
        if (overId.startsWith('column-')) {
            newStatus = overId.replace('column-', '');
            newPosition = 0;
        } else {
            // Find the task and use its status
            for (const [status, tasks] of Object.entries(tasksByStatus)) {
                const taskIndex = tasks.findIndex(t => t.id === overId);
                if (taskIndex !== -1) {
                    newStatus = status;
                    newPosition = taskIndex;
                    break;
                }
            }
        }

        if (newStatus) {
            onTaskMove?.(taskId, newStatus, newPosition);
        }
    };

    const defaultTaskCard = (task: Task) => (
        <div
            onClick={() => onTaskClick?.(task)}
            className="bg-[#1a1b4b] p-3 rounded-lg border border-[#2c2d65] hover:border-[#e0592a] transition-all cursor-pointer group"
        >
            <h4 className="text-white text-sm font-medium mb-2">{task.name}</h4>
            {task.assignedUsers && task.assignedUsers.length > 0 && (
                <div className="flex -space-x-2 overflow-hidden">
                    {task.assignedUsers.slice(0, 3).map((user) => (
                        <div
                            key={user.id}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-[#1a1b4b] bg-[#e0592a] flex items-center justify-center text-[10px] font-bold text-white"
                            title={user.name}
                        >
                            {user.name.charAt(0)}
                        </div>
                    ))}
                    {task.assignedUsers.length > 3 && (
                        <div className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-[#1a1b4b] bg-gray-600 text-[10px] font-bold text-white">
                            +{task.assignedUsers.length - 3}
                        </div>
                    )}
                </div>
            )}
            {task._count && task._count.updates > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                    {task._count.updates} {task._count.updates === 1 ? 'update' : 'updates'}
                </div>
            )}
        </div>
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 h-full overflow-x-auto p-6">
                {statuses.map(status => {
                    const statusTasks = tasksByStatus[status] || [];
                    const bgColor = statusLabels[status] || '#333';

                    return (
                        <div key={status} className="flex-shrink-0 w-80">
                            {/* Column Header */}
                            <div
                                className="p-3 rounded-t-lg mb-2 flex items-center justify-between"
                                style={{ backgroundColor: bgColor }}
                            >
                                <h3 className="text-white font-semibold text-sm uppercase">
                                    {status}
                                </h3>
                                <span className="text-white/70 text-xs font-medium">
                                    {statusTasks.length}
                                </span>
                            </div>

                            {/* Column Content */}
                            <SortableContext
                                id={`column-${status}`}
                                items={statusTasks.map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2 min-h-[200px] bg-[#0f102a]/50 p-2 rounded-b-lg">
                                    {statusTasks.map(task => (
                                        <div key={task.id}>
                                            {renderTaskCard ? renderTaskCard(task) : defaultTaskCard(task)}
                                        </div>
                                    ))}

                                    {/* Add Task Button */}
                                    <button
                                        className="w-full py-2 text-gray-500 hover:text-white hover:bg-[#1a1b4b] rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Plus size={16} />
                                        Add Item
                                    </button>
                                </div>
                            </SortableContext>
                        </div>
                    );
                })}
            </div>
        </DndContext>
    );
}

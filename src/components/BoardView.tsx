'use client';

import { useEffect, useState, useRef, Fragment } from 'react';
import { Plus, Loader2, MessageSquare, ChevronRight, ChevronDown, X, Check, User2 } from 'lucide-react';
import { Button, TextField, Dropdown, Avatar, EditableHeading, IconButton, Tooltip } from '@vibe/core';
import UpdatesDrawer from '@/components/UpdatesDrawer';

interface Task {
    id: string;
    name: string;
    state: 'ACTIVE' | 'ARCHIVED';
    columnValues: string;
    parsedValues: Record<string, any>;
    assignedUserId: string | null;
    assignedUser?: { id: string; name: string; email: string };
    description?: string;
    createdAt: string;
    subTasks?: Task[];
    _count?: { updates: number };
}

interface Column {
    id: string;
    type: string;
    title: string;
    width?: number;
    settings?: any;
}

export default function BoardView({ boardId }: { boardId: string }) {
    const [board, setBoard] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<any[]>([]);
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
    const [selectedTaskForUpdates, setSelectedTaskForUpdates] = useState<Task | null>(null);

    // Editing states
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [taskNameInput, setTaskNameInput] = useState('');

    // Adding states
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [addingSubitemFor, setAddingSubitemFor] = useState<string | null>(null);
    const [newSubitemName, setNewSubitemName] = useState('');

    // Dropdown states
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [boardId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [boardRes, tasksRes, employeesRes] = await Promise.all([
                fetch(`/api/boards/${boardId}`),
                fetch(`/api/boards/${boardId}/tasks`),
                fetch('/api/employees')
            ]);

            if (boardRes.ok && tasksRes.ok) {
                const boardData = await boardRes.json();
                const tasksData: Task[] = await tasksRes.json();

                const parsedTasks = tasksData.map(t => ({
                    ...t,
                    parsedValues: JSON.parse(t.columnValues || '{}'),
                    subTasks: t.subTasks?.map(st => ({
                        ...st,
                        parsedValues: JSON.parse(st.columnValues || '{}')
                    }))
                }));

                setBoard(boardData);
                setTasks(parsedTasks);
            }

            if (employeesRes.ok) {
                setEmployees(await employeesRes.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBoardName = async (newName: string) => {
        if (!newName.trim()) return;

        try {
            const res = await fetch(`/api/boards/${boardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                setBoard({ ...board, name: newName });
            }
        } catch (error) {
            console.error('Failed to update board name:', error);
        }
    };

    const handleCreateTask = async () => {
        if (!newTaskName.trim()) return;

        try {
            const res = await fetch(`/api/boards/${boardId}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTaskName })
            });

            if (res.ok) {
                const task = await res.json();
                setTasks(prev => [...prev, { ...task, parsedValues: {}, subTasks: [] }]);
                setNewTaskName('');
                setIsAddingTask(false);
            }
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    };

    const handleCreateSubitem = async (parentId: string) => {
        if (!newSubitemName.trim()) return;

        try {
            const res = await fetch(`/api/tasks/${parentId}/subtasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newSubitemName })
            });

            if (res.ok) {
                const subitem = await res.json();
                setTasks(prev => prev.map(t =>
                    t.id === parentId
                        ? { ...t, subTasks: [...(t.subTasks || []), { ...subitem, parsedValues: {} }] }
                        : t
                ));
                setNewSubitemName('');
                setAddingSubitemFor(null);
                setExpandedTasks(prev => new Set([...prev, parentId]));
            }
        } catch (error) {
            console.error('Failed to create subitem:', error);
        }
    };

    const handleUpdateTaskName = async (taskId: string) => {
        if (!taskNameInput.trim()) return;

        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: taskNameInput })
            });

            if (res.ok) {
                setTasks(prev => prev.map(t => {
                    if (t.id === taskId) {
                        return { ...t, name: taskNameInput };
                    }
                    if (t.subTasks) {
                        return {
                            ...t,
                            subTasks: t.subTasks.map(st =>
                                st.id === taskId ? { ...st, name: taskNameInput } : st
                            )
                        };
                    }
                    return t;
                }));
                setEditingTaskId(null);
            }
        } catch (error) {
            console.error('Failed to update task name:', error);
        }
    };

    const handleUpdateTaskColumn = async (taskId: string, columnId: string, value: any) => {
        try {
            const task = tasks.find(t => t.id === taskId || t.subTasks?.some(st => st.id === taskId));
            if (!task) return;

            const currentTask = task.id === taskId ? task : task.subTasks?.find(st => st.id === taskId);
            if (!currentTask) return;

            const newValues = { ...currentTask.parsedValues, [columnId]: value };

            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ columnValues: JSON.stringify(newValues) })
            });

            if (res.ok) {
                setTasks(prev => prev.map(t => {
                    if (t.id === taskId) {
                        return { ...t, parsedValues: newValues };
                    }
                    if (t.subTasks) {
                        return {
                            ...t,
                            subTasks: t.subTasks.map(st =>
                                st.id === taskId ? { ...st, parsedValues: newValues } : st
                            )
                        };
                    }
                    return t;
                }));
            }
        } catch (error) {
            console.error('Failed to update task column:', error);
        }
    };

    const handleAssignUser = async (taskId: string, userId: string | null) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedUserId: userId })
            });

            if (res.ok) {
                const user = userId ? employees.find(e => e.id === userId) : null;
                setTasks(prev => prev.map(t => {
                    if (t.id === taskId) {
                        return { ...t, assignedUserId: userId, assignedUser: user };
                    }
                    if (t.subTasks) {
                        return {
                            ...t,
                            subTasks: t.subTasks.map(st =>
                                st.id === taskId ? { ...st, assignedUserId: userId, assignedUser: user } : st
                            )
                        };
                    }
                    return t;
                }));
            }
            setOpenDropdown(null);
        } catch (error) {
            console.error('Failed to assign user:', error);
        }
    };

    const toggleExpanded = (taskId: string) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const renderTaskRow = (task: Task, isSubitem = false, parentId?: string) => {
        const isExpanded = expandedTasks.has(task.id);
        const hasSubitems = task.subTasks && task.subTasks.length > 0;
        const isEditing = editingTaskId === task.id;

        const statusColumn = board?.columns?.find((c: Column) => c.type === 'status');
        const statusValue = task.parsedValues[statusColumn?.id] || 'default';
        const statusSettings = statusColumn?.settings?.status?.labels || {};
        const statusColor = statusSettings[statusValue.toLowerCase()] || '#808080';
        const statusLabel = statusValue.charAt(0).toUpperCase() + statusValue.slice(1);

        // Build dropdown options for person assignment
        const personOptions = [
            { value: '___unassign', label: 'Unassign', leftAvatar: null },
            ...employees.map(emp => ({
                value: emp.id,
                label: emp.name,
                leftAvatar: emp.name.charAt(0).toUpperCase()
            }))
        ];

        return (
            <Fragment key={task.id}>
                <tr className="group hover:bg-[#1a1b4b]/50 transition-colors border-b border-[#2c2d65]">
                    {/* Task Name with expand/collapse */}
                    <td className={`p-3 ${isSubitem ? 'pl-12' : 'pl-4'}`}>
                        <div className="flex items-center gap-2">
                            {!isSubitem && (
                                <IconButton
                                    icon={isExpanded ? ChevronDown : ChevronRight}
                                    onClick={() => toggleExpanded(task.id)}
                                    size="sm"
                                    kind="tertiary"
                                    ariaLabel="Expand task"
                                />
                            )}

                            {isEditing ? (
                                <TextField
                                    value={taskNameInput}
                                    onChange={setTaskNameInput}
                                    onBlur={() => handleUpdateTaskName(task.id)}
                                    onKeyDown={(e: any) => {
                                        if (e.key === 'Enter') handleUpdateTaskName(task.id);
                                        if (e.key === 'Escape') setEditingTaskId(null);
                                    }}
                                    autoFocus
                                    size="small"
                                />
                            ) : (
                                <button
                                    onClick={() => {
                                        setEditingTaskId(task.id);
                                        setTaskNameInput(task.name);
                                    }}
                                    className="flex-1 text-left text-white text-sm hover:text-[#e0592a] transition-colors font-medium"
                                >
                                    {task.name}
                                </button>
                            )}
                        </div>
                    </td>

                    {/* Person Column with Vibe Dropdown */}
                    <td className="p-3">
                        <Dropdown
                            placeholder="Select person"
                            options={personOptions}
                            value={task.assignedUserId || undefined}
                            onChange={(option: any) => {
                                if (option?.value === '___unassign') {
                                    handleAssignUser(task.id, null);
                                } else {
                                    handleAssignUser(task.id, option?.value);
                                }
                            }}
                            size="small"
                            className="w-full"
                        />
                    </td>

                    {/* Status Column */}
                    <td className="p-3">
                        <div className="relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === `status-${task.id}` ? null : `status-${task.id}`)}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:brightness-110 transition-all w-full text-left"
                                style={{ backgroundColor: statusColor }}
                            >
                                {statusLabel}
                            </button>

                            {openDropdown === `status-${task.id}` && statusColumn && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-[#1a1b4b] border border-[#2c2d65] rounded-lg shadow-2xl z-50 overflow-hidden">
                                        {Object.entries(statusSettings).map(([key, color]) => (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    handleUpdateTaskColumn(task.id, statusColumn.id, key);
                                                    setOpenDropdown(null);
                                                }}
                                                className="w-full px-4 py-3 text-left hover:bg-[#2c2d65] transition-colors flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color as string }} />
                                                    <span className="text-sm text-white font-medium">
                                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                                    </span>
                                                </div>
                                                {statusValue.toLowerCase() === key.toLowerCase() && (
                                                    <Check size={16} className="text-[#e0592a]" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </td>

                    {/* Updates */}
                    <td className="p-3">
                        <Button
                            onClick={() => setSelectedTaskForUpdates(task)}
                            kind="tertiary"
                            size="small"
                            leftIcon={MessageSquare}
                        >
                            {task._count?.updates || 0}
                        </Button>
                    </td>
                </tr>

                {/* Add Subitem Row */}
                {isExpanded && !isSubitem && (
                    <>
                        {task.subTasks?.map(subTask => renderTaskRow(subTask, true, task.id))}

                        {addingSubitemFor === task.id ? (
                            <tr className="border-b border-[#2c2d65]">
                                <td colSpan={4} className="p-3 pl-12">
                                    <div className="flex items-center gap-2">
                                        <TextField
                                            value={newSubitemName}
                                            onChange={setNewSubitemName}
                                            onKeyDown={(e: any) => {
                                                if (e.key === 'Enter') handleCreateSubitem(task.id);
                                                if (e.key === 'Escape') {
                                                    setAddingSubitemFor(null);
                                                    setNewSubitemName('');
                                                }
                                            }}
                                            placeholder="Enter subitem name..."
                                            autoFocus
                                            size="small"
                                        />
                                        <Button onClick={() => handleCreateSubitem(task.id)} size="small">
                                            Add
                                        </Button>
                                        <IconButton
                                            icon={X}
                                            onClick={() => {
                                                setAddingSubitemFor(null);
                                                setNewSubitemName('');
                                            }}
                                            size="sm"
                                            kind="tertiary"
                                            ariaLabel="Cancel"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <tr className="border-b border-[#2c2d65] group/add">
                                <td colSpan={4} className="p-2 pl-12">
                                    <Button
                                        onClick={() => setAddingSubitemFor(task.id)}
                                        kind="tertiary"
                                        size="small"
                                        leftIcon={Plus}
                                    >
                                        Add Subitem
                                    </Button>
                                </td>
                            </tr>
                        )}
                    </>
                )}
            </Fragment>
        );
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-white bg-[#0f102a]">
                <Loader2 className="animate-spin mr-2" />
                Loading Board...
            </div>
        );
    }

    if (!board) {
        return (
            <div className="flex h-full items-center justify-center text-white bg-[#0f102a]">
                Board not found
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-[#0f102a] overflow-hidden">
            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${selectedTaskForUpdates ? 'mr-[450px]' : ''}`}>
                {/* Header - Compact & Visible */}
                <div className="py-3 px-5 border-b border-[#2c2d65] flex justify-between items-center bg-[#0f102a] sticky top-0 z-20">
                    <div className="flex-1">
                        <EditableHeading
                            type="h2"
                            value={board.name}
                            onChange={handleUpdateBoardName}
                            className="!text-white !font-bold !text-2xl"
                        />
                        <p className="text-xs text-gray-400 mt-0.5">Department: {board.department?.name}</p>
                    </div>

                    <Button
                        onClick={() => setIsAddingTask(true)}
                        leftIcon={Plus}
                        size="medium"
                    >
                        New Item
                    </Button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10 bg-[#0f102a]">
                            <tr>
                                <th className="py-2 px-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-r border-[#2c2d65] bg-[#151642]">
                                    Item
                                </th>
                                <th className="py-2 px-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-r border-[#2c2d65] bg-[#151642] w-48">
                                    Person
                                </th>
                                <th className="py-2 px-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-r border-[#2c2d65] bg-[#151642] w-40">
                                    Status
                                </th>
                                <th className="py-2 px-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-[#2c2d65] bg-[#151642] w-28">
                                    Updates
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isAddingTask && (
                                <tr className="border-b border-[#2c2d65] bg-[#1a1b4b]/30">
                                    <td colSpan={4} className="py-2 px-2.5">
                                        <div className="flex items-center gap-2">
                                            <TextField
                                                value={newTaskName}
                                                onChange={setNewTaskName}
                                                onKeyDown={(e: any) => {
                                                    if (e.key === 'Enter') handleCreateTask();
                                                    if (e.key === 'Escape') {
                                                        setIsAddingTask(false);
                                                        setNewTaskName('');
                                                    }
                                                }}
                                                placeholder="Enter task name..."
                                                autoFocus
                                                size="medium"
                                            />
                                            <Button onClick={handleCreateTask}>
                                                Add Task
                                            </Button>
                                            <IconButton
                                                icon={X}
                                                onClick={() => {
                                                    setIsAddingTask(false);
                                                    setNewTaskName('');
                                                }}
                                                size="md"
                                                kind="tertiary"
                                                ariaLabel="Cancel"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {tasks.map(task => renderTaskRow(task))}

                            {tasks.length === 0 && !isAddingTask && (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-[#1a1b4b] rounded-full flex items-center justify-center">
                                                <Plus size={32} className="text-gray-600" />
                                            </div>
                                            <p>No items yet. Click "New Item" to get started!</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Updates Drawer */}
            <UpdatesDrawer
                task={selectedTaskForUpdates}
                onClose={() => setSelectedTaskForUpdates(null)}
            />
        </div>
    );
}

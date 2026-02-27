'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from 'react';
import { X, User, ChevronDown, Calendar, Tag, AlignLeft } from 'lucide-react';

interface TaskModalProps {
    task: any;
    employees: any[];
    onClose: () => void;
    onUpdate: (updatedTask: any) => void;
}

export default function TaskModal({ task, employees, onClose, onUpdate }: TaskModalProps) {
    const [name, setName] = useState(task.name);
    const [description, setDescription] = useState(task.description || '');

    // Custom Dropdown States
    const [statusOpen, setStatusOpen] = useState(false);
    const [assigneeOpen, setAssigneeOpen] = useState(false);

    const statusRef = useRef<HTMLDivElement>(null);
    const assigneeRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
                setStatusOpen(false);
            }
            if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
                setAssigneeOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleNameBlur = () => {
        if (name !== task.name) {
            updateTask({ name });
        }
    };

    const handleDescriptionBlur = () => {
        if (description !== (task.description || '')) {
            updateTask({ description });
        }
    };

    const updateTask = async (updates: any) => {
        try {
            // If updating status, we need to handle columnValues structure
            let body = updates;
            if (updates.status) {
                body = { columnValues: { status: updates.status } };
            }
            if (updates.assignedUserIds) {
                body = { assignedUserIds: updates.assignedUserIds };
            }

            const res = await fetch(`/api/tasks/${task.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const updated = await res.json();
                // Merge parsedValues for the parent
                updated.parsedValues = JSON.parse(updated.columnValues || '{}');
                onUpdate(updated);
            }
        } catch (e) {
            console.error("Failed to update task", e);
        }
    };

    const getStatusStyle = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'done') return { background: 'var(--grad-done)' };
        if (s === 'working on it') return { background: 'var(--grad-working)' };
        if (s === 'stuck') return { backgroundColor: '#e2445c' };
        return { backgroundColor: '#c4c4c4' }; // Default/Active
    };

    const currentStatus = task.parsedValues['status'] || 'Active';
    // Fix casing: Capitalize first letter
    const displayStatus = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).toLowerCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e1f50] w-full max-w-2xl rounded-xl shadow-2xl border border-[rgba(255,255,255,0.1)] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-[rgba(255,255,255,0.1)] flex justify-between items-start">
                    <div className="flex-1 mr-4">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleNameBlur}
                            className="bg-transparent text-2xl font-bold text-white border-none focus:ring-0 w-full p-0 placeholder-gray-500"
                            placeholder="Task Name"
                        />
                        <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                            <span className="bg-[#2c2d65] px-2 py-0.5 rounded text-xs">Task</span>
                            <span>in {task.board?.name || 'Board'}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#2c2d65] rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* content */}
                <div className="flex-1 overflow-y-auto p-6 text-white grid grid-cols-3 gap-8">
                    {/* Left Column (Main Info) */}
                    <div className="col-span-2 space-y-8">

                        {/* Status & Assignee Row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Status Dropdown */}
                            <div className="relative" ref={statusRef}>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                                <button
                                    onClick={() => setStatusOpen(!statusOpen)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-medium transition-all hover:opacity-90 active:scale-95 text-white"
                                    style={getStatusStyle(currentStatus)}
                                >
                                    <span>{displayStatus}</span>
                                    <ChevronDown size={16} className="text-white/70" />
                                </button>

                                {statusOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#2c2d65] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-10 overflow-hidden">
                                        {['Active', 'Working on it', 'Done', 'Stuck'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => {
                                                    updateTask({ status: s });
                                                    setStatusOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-[#3d3e80] text-sm flex items-center gap-2 transition-colors"
                                            >
                                                <div className="w-3 h-3 rounded-full" style={getStatusStyle(s)}></div>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Assignee Dropdown */}
                            <div className="relative" ref={assigneeRef}>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assignee</label>
                                <button
                                    onClick={() => setAssigneeOpen(!assigneeOpen)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#0f102a] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all"
                                >
                                    <div className="flex -space-x-1 overflow-hidden max-w-[150px]">
                                        {task.assignedUsers && task.assignedUsers.length > 0 ? (
                                            task.assignedUsers.map((user: any) => (
                                                <div
                                                    key={user.id}
                                                    className="w-6 h-6 rounded-full bg-[#e0592a] border-2 border-[#0f102a] flex items-center justify-center text-[10px] font-bold shrink-0"
                                                    title={user.name}
                                                >
                                                    {user.name.charAt(0)}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs shrink-0">
                                                    <User size={14} />
                                                </div>
                                                <span>Unassigned</span>
                                            </div>
                                        )}
                                    </div>
                                    <ChevronDown size={16} className="text-gray-500" />
                                </button>

                                {assigneeOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#2c2d65] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-10 overflow-hidden max-h-48 overflow-y-auto">
                                        <button
                                            onClick={() => {
                                                updateTask({ assignedUserIds: [] });
                                                setAssigneeOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-[#3d3e80] text-sm flex items-center gap-2 text-gray-300"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                                                <X size={14} />
                                            </div>
                                            Clear All
                                        </button>
                                        {employees.map((emp) => {
                                            const isSelected = task.assignedUsers?.some((u: any) => u.id === emp.id);
                                            return (
                                                <button
                                                    key={emp.id}
                                                    onClick={() => {
                                                        const currentIds = task.assignedUsers?.map((u: any) => u.id) || [];
                                                        const newIds = isSelected
                                                            ? currentIds.filter((id: string) => id !== emp.id)
                                                            : [...currentIds, emp.id];
                                                        updateTask({ assignedUserIds: newIds });
                                                    }}
                                                    className={`w-full text-left px-3 py-2 hover:bg-[#3d3e80] text-sm flex items-center justify-between group ${isSelected ? 'bg-[#3d3e80]/50' : ''}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-[#e0592a] flex items-center justify-center text-xs font-bold">
                                                            {emp.name.charAt(0)}
                                                        </div>
                                                        <span className={isSelected ? 'text-white' : 'text-gray-300'}>{emp.name}</span>
                                                    </div>
                                                    {isSelected && <X size={12} className="text-gray-500 group-hover:text-white" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description / Notes area */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlignLeft size={14} /> Description
                            </label>
                            <textarea
                                className="w-full bg-[#0f102a] rounded-lg border border-[rgba(255,255,255,0.1)] min-h-[100px] p-3 text-sm text-gray-300 focus:ring-1 focus:ring-[#e0592a] focus:outline-none resize-none"
                                placeholder="Add a description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onBlur={handleDescriptionBlur}
                            />
                        </div>

                        {/* Subtasks */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sub-items</label>
                            {task.subTasks && task.subTasks.length > 0 ? (
                                <ul className="space-y-2 mb-2">
                                    {task.subTasks.map((sub: any) => (
                                        <li key={sub.id} className="flex items-center gap-2 p-2 bg-[#0f102a] rounded border border-[rgba(255,255,255,0.05)]">
                                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                            <span className="text-sm">{sub.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 italic mb-2">No sub-items yet.</p>
                            )}

                            <input
                                type="text"
                                placeholder="+ Add sub-item"
                                className="w-full bg-transparent border-b border-gray-700 text-sm py-1 focus:outline-none focus:border-orange-500 transition-colors placeholder-[#e0592a]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const target = e.target as HTMLInputElement;
                                        const val = target.value;
                                        if (!val) return;

                                        fetch(`/api/tasks/${task.id}/subtasks`, {
                                            method: 'POST',
                                            body: JSON.stringify({ name: val })
                                        }).then(res => res.json()).then(sub => {
                                            // Optimistic update or refetch? 
                                            // For now, let's update parent locally if possible, or trigger refresh.
                                            // The BoardView handles updates via onUpdate, but appending subtask is tricky if we don't have full structure.
                                            // Easiest is to manually append to task.subTasks and call onUpdate?
                                            // But task is prop.

                                            // Better: construct new task object with new subtask
                                            const newSubTasks = [...(task.subTasks || []), sub];
                                            const updatedTask = { ...task, subTasks: newSubTasks };
                                            onUpdate(updatedTask);
                                            target.value = '';
                                        });
                                    }
                                }}
                            />
                        </div>

                    </div>

                    {/* Right Column (Meta) */}
                    <div className="border-l border-[rgba(255,255,255,0.1)] pl-8 space-y-6">
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Item Info</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-300">
                                    <Calendar size={16} className="text-gray-500" />
                                    <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-300">
                                    <User size={16} className="text-gray-500" />
                                    <span>Creator: {task.creator?.name || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-300">
                                    <Tag size={16} className="text-gray-500" />
                                    <span>ID: {task.id.slice(0, 8)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Updates / Activity Log Placeholder */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Activity</h4>
                            <div className="text-sm text-gray-500">No recent updates</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

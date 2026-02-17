'use client';

import { ChevronDown, ChevronRight, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Group as GroupType, Task } from '@/lib/types';

interface GroupProps {
    group: GroupType;
    tasks: Task[];
    columns: any[];
    onAddTask?: (groupId: string) => void;
    onUpdateGroup?: (groupId: string, updates: Partial<GroupType>) => void;
    onDeleteGroup?: (groupId: string) => void;
    renderTaskRow: (task: Task) => React.ReactNode;
}

export default function Group({
    group,
    tasks,
    columns,
    onAddTask,
    onUpdateGroup,
    onDeleteGroup,
    renderTaskRow
}: GroupProps) {
    const [isCollapsed, setIsCollapsed] = useState(group.collapsed);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(group.title);
    const [showMenu, setShowMenu] = useState(false);

    const handleToggleCollapse = () => {
        const newCollapsed = !isCollapsed;
        setIsCollapsed(newCollapsed);
        onUpdateGroup?.(group.id, { collapsed: newCollapsed });
    };

    const handleTitleChange = () => {
        if (title.trim() && title !== group.title) {
            onUpdateGroup?.(group.id, { title: title.trim() });
        }
        setIsEditing(false);
    };

    const groupColor = group.color || '#e0592a';

    return (
        <div className="mb-4">
            {/* Group Header */}
            <div
                className="flex items-center gap-2 py-3 px-4 bg-[#1a1b4b] rounded-t-lg border-l-4 hover:bg-[#1f204a] transition-colors group/header"
                style={{ borderLeftColor: groupColor }}
            >
                <button
                    onClick={handleToggleCollapse}
                    className="text-gray-300 hover:text-white transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>

                {isEditing ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTitleChange();
                            if (e.key === 'Escape') {
                                setTitle(group.title);
                                setIsEditing(false);
                            }
                        }}
                        className="flex-1 bg-transparent text-white font-semibold text-sm focus:outline-none border-b border-white/30"
                        autoFocus
                    />
                ) : (
                    <h3
                        className="flex-1 text-white font-semibold text-sm cursor-pointer"
                        onClick={() => setIsEditing(true)}
                    >
                        {group.title}
                    </h3>
                )}

                <span className="text-xs text-gray-400 font-medium">
                    {tasks.length} {tasks.length === 1 ? 'item' : 'items'}
                </span>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover/header:opacity-100 p-1"
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1b4b] border border-[#2c2d65] rounded-lg shadow-xl z-50">
                            <button
                                onClick={() => {
                                    onAddTask?.(group.id);
                                    setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2c2d65] hover:text-white transition-colors flex items-center gap-2"
                            >
                                <Plus size={14} />
                                Add Item
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm(`Delete group "${group.title}"?`)) {
                                        onDeleteGroup?.(group.id);
                                    }
                                    setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={14} />
                                Delete Group
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Group Content */}
            {!isCollapsed && (
                <div className="border-l-4" style={{ borderLeftColor: groupColor }}>
                    {tasks.map(task => (
                        <div key={task.id}>
                            {renderTaskRow(task)}
                        </div>
                    ))}

                    {/* Add Item Row */}
                    <div
                        onClick={() => onAddTask?.(group.id)}
                        className="flex items-center gap-2 px-8 py-3 text-gray-500 hover:text-white hover:bg-[#1a1b4b] cursor-pointer transition-colors border-b border-[#2c2d65]/50"
                    >
                        <Plus size={16} />
                        <span className="text-sm font-medium">Add Item</span>
                    </div>
                </div>
            )}
        </div>
    );
}

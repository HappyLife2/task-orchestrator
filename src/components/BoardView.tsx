/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Loader2, ChevronRight, ChevronDown, X, Check, GripVertical, Calendar, Trash2 } from 'lucide-react';
import { Button, TextField, Dropdown, EditableHeading, IconButton, Counter, Icon } from '@vibe/core';
import { Update, AddUpdate } from '@vibe/icons';
import UpdatesDrawer from '@/components/UpdatesDrawer';
import { PortalMenu } from '@/components/PortalMenu';

// ─── Dropdown Cell (Importance / Urgency / Task Load) ────────────────────────


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

// ─── Resizable Column Hook ────────────────────────────────────────────────────
function useColumnWidths(columns: Column[]) {
    const [widths, setWidths] = useState<Record<string, number>>({});

    // Initialise widths from column definitions
    useEffect(() => {
        if (columns.length === 0) return;
        const initial: Record<string, number> = {};
        columns.forEach(col => {
            initial[col.id] = col.width ?? 150;
        });
        setWidths(initial);
    }, [columns.map(c => c.id).join(',')]);

    const startResize = useCallback((colId: string, startX: number) => {
        const startWidth = widths[colId] ?? 150;

        const onMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - startX;
            setWidths(prev => ({
                ...prev,
                [colId]: Math.max(80, startWidth + delta)
            }));
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [widths]);

    return { widths, startResize };
}

// ─── Dropdown Cell (Importance / Urgency / Task Load) ────────────────────────
function DropdownCell({ value, onChange, options }: {
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string; color?: string }[];
}) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const selected = options.find(o => o.value === value);

    return (
        <div className="w-full h-full flex items-center justify-center px-1">
            <button
                ref={btnRef}
                onClick={() => setOpen(o => !o)}
                className="w-full h-7 rounded-md text-white text-xs font-medium flex items-center justify-center gap-1 transition-opacity hover:opacity-80 px-2"
                style={{ backgroundColor: selected?.color ?? '#2c2d65' }}
            >
                {selected?.label ?? <span className="text-gray-500">—</span>}
            </button>

            {open && (
                <PortalMenu triggerRef={btnRef} onClose={() => setOpen(false)}>
                    <div className="bg-[#1a1b4b] border border-[#2c2d65] rounded-lg shadow-2xl overflow-hidden">
                        <button
                            onClick={() => { onChange(''); setOpen(false); }}
                            className="w-full px-3 py-2 text-left hover:bg-[#2c2d65] text-xs text-gray-400"
                        >
                            — Clear
                        </button>
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className="w-full px-3 py-2 text-left hover:bg-[#2c2d65] transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    {opt.color && <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: opt.color }} />}
                                    <span className="text-xs text-gray-200">{opt.label}</span>
                                </div>
                                {value === opt.value && <Check size={12} className="text-[#e0592a]" />}
                            </button>
                        ))}
                    </div>
                </PortalMenu>
            )}
        </div>
    );
}

// ─── Status Cell ──────────────────────────────────────────────────────────────
function StatusCell({ value, onChange, settings }: {
    value: string;
    onChange: (v: string) => void;
    settings: { labels: Record<string, string> };
}) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const labels = settings?.labels ?? {};
    const color = labels[value?.toLowerCase()] ?? '#c4c4c4';
    const label = value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Select status';

    return (
        <div className="w-full h-full flex items-center px-1">
            <button
                ref={btnRef}
                onClick={() => setOpen(o => !o)}
                className="w-full h-7 rounded-md text-white text-xs font-semibold flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ backgroundColor: color }}
            >
                {label}
            </button>

            {open && (
                <PortalMenu triggerRef={btnRef} onClose={() => setOpen(false)}>
                    <div className="bg-[#1a1b4b] border border-[#2c2d65] rounded-lg shadow-2xl overflow-hidden">
                        {Object.entries(labels).map(([key, clr]) => (
                            <button
                                key={key}
                                onClick={() => { onChange(key); setOpen(false); }}
                                className="w-full px-3 py-2.5 text-left hover:bg-[#2c2d65] transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: clr as string }} />
                                    <span className="text-xs text-gray-200 capitalize">{key}</span>
                                </div>
                                {value?.toLowerCase() === key.toLowerCase() && <Check size={12} className="text-[#e0592a]" />}
                            </button>
                        ))}
                    </div>
                </PortalMenu>
            )}
        </div>
    );
}

// ─── Timeline Cell ────────────────────────────────────────────────────────────
function TimelineCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);

    const parts = (value ?? '').split('/');
    const [start, setStart] = useState(parts[0] ?? '');
    const [end, setEnd] = useState(parts[1] ?? '');

    useEffect(() => {
        const p = (value ?? '').split('/');
        setStart(p[0] ?? '');
        setEnd(p[1] ?? '');
    }, [value]);

    const apply = () => {
        onChange(`${start}/${end}`);
        setOpen(false);
    };

    const clear = () => {
        setStart('');
        setEnd('');
        onChange('');
        setOpen(false);
    };

    const formatDisplay = (d: string) => {
        if (!d) return '';
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y?.slice(2)}`;
    };

    const displayText = start && end
        ? `${formatDisplay(start)} → ${formatDisplay(end)}`
        : start ? formatDisplay(start)
            : null;

    return (
        <div className="w-full h-full flex items-center px-1">
            <button
                ref={btnRef}
                onClick={() => setOpen(o => !o)}
                className="w-full h-7 rounded-md bg-[#2c2d65] text-xs text-gray-300 flex items-center justify-center gap-1.5 hover:bg-[#33345c] transition-colors px-2"
            >
                <Calendar size={11} className="text-[#e0592a] flex-shrink-0" />
                <span className="truncate">{displayText ?? <span className="text-gray-500">Set dates</span>}</span>
            </button>

            {open && (
                <PortalMenu triggerRef={btnRef} onClose={() => setOpen(false)}>
                    <div
                        className="w-64 bg-[#1a1b4b] border border-[#2c2d65] rounded-xl shadow-2xl p-4 flex flex-col gap-3"
                        onClick={e => e.stopPropagation()}
                    >
                        <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">Select Date Range</p>

                        <div className="flex flex-col gap-2">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">From</label>
                                <input
                                    type="date"
                                    value={start}
                                    onChange={e => setStart(e.target.value)}
                                    className="w-full bg-[#0f102a] border border-[#2c2d65] focus:border-[#e0592a] rounded-lg px-3 py-1.5 text-xs text-white outline-none transition-colors cursor-pointer"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">To</label>
                                <input
                                    type="date"
                                    value={end}
                                    min={start}
                                    onChange={e => setEnd(e.target.value)}
                                    className="w-full bg-[#0f102a] border border-[#2c2d65] focus:border-[#e0592a] rounded-lg px-3 py-1.5 text-xs text-white outline-none transition-colors cursor-pointer"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                        </div>

                        {start && end && (
                            <div className="bg-[#0f102a] rounded-lg px-3 py-2 text-center">
                                <span className="text-xs text-[#e0592a] font-medium">
                                    {formatDisplay(start)} → {formatDisplay(end)}
                                </span>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={apply}
                                disabled={!start || !end}
                                className="flex-1 bg-[#e0592a] hover:bg-[#c94d22] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                            >
                                Apply
                            </button>
                            <button
                                onClick={clear}
                                className="px-3 bg-[#2c2d65] hover:bg-[#33345c] text-gray-400 text-xs py-1.5 rounded-lg transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </PortalMenu>
            )}
        </div>
    );
}

// ─── Inline Text Cell ─────────────────────────────────────────────────────────
function InlineTextCell({ value, onChange, placeholder }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value ?? '');

    useEffect(() => { setDraft(value ?? ''); }, [value]);

    if (editing) {
        return (
            <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={() => { setEditing(false); if (draft !== value) onChange(draft); }}
                onKeyDown={e => {
                    if (e.key === 'Enter') { setEditing(false); if (draft !== value) onChange(draft); }
                    if (e.key === 'Escape') { setEditing(false); setDraft(value ?? ''); }
                }}
                placeholder={placeholder}
                className="w-full bg-[#1a1b4b] border border-[#e0592a] rounded px-2 py-1 text-xs text-white outline-none"
            />
        );
    }

    return (
        <div
            onClick={() => setEditing(true)}
            className="w-full h-7 flex items-center px-2 text-xs text-gray-300 cursor-text hover:bg-[#1a1b4b] rounded transition-colors truncate"
        >
            {draft || <span className="text-gray-600">{placeholder ?? '—'}</span>}
        </div>
    );
}

// ─── Person Cell ──────────────────────────────────────────────────────────────
function PersonCell({ value, onChange, employees }: {
    value: string | null;
    onChange: (v: string | null) => void;
    employees: any[];
}) {
    const options = [
        { value: '___unassign', label: 'Unassign' },
        ...employees.map(e => ({ value: e.id, label: e.name }))
    ];

    return (
        <div className="px-1 w-full">
            <Dropdown
                placeholder="Assign..."
                options={options}
                value={value ?? undefined}
                onChange={(opt: any) => onChange(opt?.value === '___unassign' ? null : opt?.value ?? null)}
                size="small"
                className="w-full"
            />
        </div>
    );
}

// ─── Draggable Task Row ───────────────────────────────────────────────────────
function DraggableTaskRow({ taskId, isDragging, isSubitem, children }: {
    taskId: string;
    isDragging: boolean;
    isSubitem: boolean;
    children: React.ReactNode;
}) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: taskId, disabled: isSubitem });
    const style = transform ? { transform: CSS.Translate.toString(transform), opacity: 0.4 } : undefined;
    return (
        <tr
            ref={setNodeRef}
            style={style}
            {...(isSubitem ? {} : { ...attributes, ...listeners })}
            className={`group hover:bg-[#1a1b4b]/50 transition-colors border-b border-[#2c2d65] ${isDragging ? 'opacity-40' : ''}`}
        >
            {children}
        </tr>
    );
}

// ─── Droppable Section ────────────────────────────────────────────────────────
function DroppableSection({ sectionId, colSpan, children }: {
    sectionId: string;
    colSpan: number;
    children: React.ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: sectionId });
    return (
        <>
            {children}
            {/* Drop target row — always present so the section is droppable even when empty */}
            <tr ref={setNodeRef}>
                <td
                    colSpan={colSpan}
                    className={`h-8 transition-colors border-b border-dashed border-[#2c2d65] ${isOver ? 'bg-blue-500/10 border-blue-500/50' : 'bg-transparent'
                        }`}
                >
                    {isOver && (
                        <div className="flex items-center justify-center h-full text-xs text-blue-400 opacity-70">
                            Drop here
                        </div>
                    )}
                </td>
            </tr>
        </>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BoardView({ boardId }: { boardId: string }) {
    const [board, setBoard] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<any[]>([]);
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
    const [selectedTaskForUpdates, setSelectedTaskForUpdates] = useState<Task | null>(null);

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [taskNameInput, setTaskNameInput] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [addingSubitemFor, setAddingSubitemFor] = useState<string | null>(null);
    const [newSubitemName, setNewSubitemName] = useState('');
    const [isDoneSectionCollapsed, setIsDoneSectionCollapsed] = useState(false);
    const [isWipSectionCollapsed, setIsWipSectionCollapsed] = useState(false);
    const [isNewItemMenuOpen, setIsNewItemMenuOpen] = useState(false);
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const [customSections, setCustomSections] = useState<{ id: string; name: string; color: string; collapsed: boolean }[]>([]);
    const [newSectionColor, setNewSectionColor] = useState('#e0592a');
    // taskSections maps taskId → sectionId ('wip' | 'done' | custom UUID)
    const [taskSections, setTaskSections] = useState<Record<string, string>>({});
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const newItemBtnRef = useRef<HTMLDivElement>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const columns: Column[] = board?.columns ?? [];
    const { widths, startResize } = useColumnWidths(columns);

    // ── Split tasks into active and done ───────────────────────────────────────
    // Find the status column id to check against
    const statusColId = columns.find(c => c.id === 'status')?.id ?? 'status';

    // Tasks split by their assigned section (taskSections overrides status-based split)
    const getTaskSection = (task: Task) => taskSections[task.id] ?? (((task.parsedValues?.[statusColId] ?? '').toLowerCase() === 'done') ? 'done' : 'wip');
    const doneTasks = tasks.filter(t => getTaskSection(t) === 'done');
    const wipTasks = tasks.filter(t => getTaskSection(t) === 'wip');
    const sectionTasks = (sectionId: string) => tasks.filter(t => getTaskSection(t) === sectionId);

    const fetchData = useCallback(async () => {
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
    }, [boardId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpdateBoardName = async (newName: string) => {
        if (!newName.trim()) return;
        try {
            const res = await fetch(`/api/boards/${boardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) setBoard({ ...board, name: newName });
        } catch (error) { console.error(error); }
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
        } catch (error) { console.error(error); }
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
        } catch (error) { console.error(error); }
    };

    const handleDeleteTask = async (taskId: string, isSubitem = false, parentId?: string) => {
        // Optimistic remove
        setTasks(prev => {
            if (isSubitem && parentId) {
                return prev.map(t => t.id === parentId
                    ? { ...t, subTasks: (t.subTasks || []).filter(st => st.id !== taskId) }
                    : t
                );
            }
            return prev.filter(t => t.id !== taskId);
        });
        try {
            const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            if (!res.ok) {
                console.error('Failed to delete task:', await res.text());
                // Refetch to restore state on failure
                fetchData();
            }
        } catch (error) { console.error(error); fetchData(); }
    };

    const handleCreateSection = () => {
        if (!newSectionName.trim()) return;
        setCustomSections(prev => [...prev, { id: crypto.randomUUID(), name: newSectionName.trim(), color: newSectionColor, collapsed: false }]);
        setNewSectionName('');
        setNewSectionColor('#e0592a');
        setIsAddingSection(false);
    };

    // ── Drag and Drop ──────────────────────────────────────────────────────────
    const handleDragStart = ({ active }: any) => {
        setActiveDragId(active.id as string);
    };

    const handleDragEnd = async ({ active, over }: any) => {
        setActiveDragId(null);
        if (!over || active.id === over.id) return;
        const taskId = active.id as string;
        const targetSectionId = over.id as string;
        const currentSectionId = getTaskSection(tasks.find(t => t.id === taskId)!);
        if (currentSectionId === targetSectionId) return;

        // Optimistically update section
        setTaskSections(prev => ({ ...prev, [taskId]: targetSectionId }));

        // If moving INTO done, update status via API
        if (targetSectionId === 'done') {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                const newValues = { ...(task.parsedValues ?? {}), [statusColId]: 'Done' };
                try {
                    await fetch(`/api/tasks/${taskId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ columnValues: JSON.stringify(newValues) }),
                    });
                    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, parsedValues: newValues } : t));
                } catch { /* keep optimistic */ }
            }
        }
        // If moving OUT of done back to wip/custom, clear the done status
        if (currentSectionId === 'done' && targetSectionId !== 'done') {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                const newValues = { ...(task.parsedValues ?? {}), [statusColId]: '' };
                try {
                    await fetch(`/api/tasks/${taskId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ columnValues: JSON.stringify(newValues) }),
                    });
                    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, parsedValues: newValues } : t));
                } catch { /* keep optimistic */ }
            }
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
                    if (t.id === taskId) return { ...t, name: taskNameInput };
                    if (t.subTasks) return { ...t, subTasks: t.subTasks.map(st => st.id === taskId ? { ...st, name: taskNameInput } : st) };
                    return t;
                }));
                setEditingTaskId(null);
            }
        } catch (error) { console.error(error); }
    };

    const handleUpdateTaskColumn = async (taskId: string, columnId: string, value: any) => {
        // Special case: person column updates assignedUserId directly
        if (columnId === 'assignedUserId') {
            try {
                const res = await fetch(`/api/tasks/${taskId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assignedUserId: value })
                });
                if (res.ok) {
                    const user = value ? employees.find(e => e.id === value) : null;
                    setTasks(prev => prev.map(t => {
                        if (t.id === taskId) return { ...t, assignedUserId: value, assignedUser: user };
                        if (t.subTasks) return { ...t, subTasks: t.subTasks.map(st => st.id === taskId ? { ...st, assignedUserId: value, assignedUser: user } : st) };
                        return t;
                    }));
                }
            } catch (error) { console.error(error); }
            return;
        }

        // Generic column value update
        try {
            const findTask = (id: string): Task | undefined => {
                const root = tasks.find(t => t.id === id);
                if (root) return root;
                for (const t of tasks) {
                    const sub = t.subTasks?.find(st => st.id === id);
                    if (sub) return sub;
                }
            };
            const currentTask = findTask(taskId);
            if (!currentTask) return;

            const newValues = { ...currentTask.parsedValues, [columnId]: value };

            // If Status changes to/from Done, update section assignment
            if (columnId === statusColId) {
                const isDone = String(value).toLowerCase() === 'done';
                setTaskSections(prev => {
                    const next = { ...prev };
                    if (isDone) {
                        next[taskId] = 'done';
                    } else if (next[taskId] === 'done') {
                        delete next[taskId];
                    }
                    return next;
                });
            }

            // Optimistic update — update UI immediately so user sees the change
            setTasks(prev => prev.map(t => {
                if (t.id === taskId) return { ...t, parsedValues: newValues };
                if (t.subTasks) return { ...t, subTasks: t.subTasks.map(st => st.id === taskId ? { ...st, parsedValues: newValues } : st) };
                return t;
            }));

            // Send plain object — API schema expects z.record(z.string(), z.any()), NOT a string
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ columnValues: newValues })
            });

            if (!res.ok) {
                // Revert optimistic update on failure
                setTasks(prev => prev.map(t => {
                    if (t.id === taskId) return { ...t, parsedValues: currentTask.parsedValues };
                    if (t.subTasks) return { ...t, subTasks: t.subTasks.map(st => st.id === taskId ? { ...st, parsedValues: currentTask.parsedValues } : st) };
                    return t;
                }));
                console.error('Failed to update column value:', await res.text());
            }
        } catch (error) { console.error(error); }
    };

    const toggleExpanded = (taskId: string) => {
        setExpandedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) { next.delete(taskId); } else { next.add(taskId); }
            return next;
        });
    };

    // ── Cell Renderer ──────────────────────────────────────────────────────────
    const renderCell = (col: Column, task: Task, isSubitem: boolean) => {
        const val = task.parsedValues?.[col.id] ?? '';

        if (col.id === 'item') {
            const isExpanded = expandedTasks.has(task.id);
            const isEditing = editingTaskId === task.id;
            return (
                <div className={`flex items-center gap-2 h-full ${isSubitem ? 'pl-10' : 'pl-3'} pr-2`}>
                    {!isSubitem && (
                        <IconButton
                            icon={(isExpanded ? ChevronDown : ChevronRight) as any}
                            onClick={() => toggleExpanded(task.id)}
                            size="small"
                            kind="tertiary"
                            ariaLabel="Expand"
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
                            onClick={() => { setEditingTaskId(task.id); setTaskNameInput(task.name); }}
                            className="flex-1 text-left text-white text-sm hover:text-[#e0592a] transition-colors font-medium truncate"
                        >
                            {task.name}
                        </button>
                    )}
                </div>
            );
        }

        if (col.id === 'person') {
            return (
                <PersonCell
                    value={task.assignedUserId}
                    onChange={v => handleUpdateTaskColumn(task.id, 'assignedUserId', v)}
                    employees={employees}
                />
            );
        }

        if (col.id === 'status') {
            return (
                <StatusCell
                    value={val}
                    onChange={v => handleUpdateTaskColumn(task.id, col.id, v)}
                    settings={col.settings?.status ?? { labels: {} }}
                />
            );
        }

        if (col.id === 'updates') {
            return (
                <div
                    className="flex justify-center w-full relative group/chat-icon cursor-pointer"
                    onClick={() => setSelectedTaskForUpdates(task)}
                >
                    {(task._count?.updates ?? 0) === 0 ? (
                        <div className="text-gray-400 hover:text-blue-500 transition-colors">
                            <Icon icon={AddUpdate} iconSize={24} />
                        </div>
                    ) : (
                        <div style={{ position: "relative" }}>
                            <Icon icon={Update} iconSize={24} className="text-blue-500" />
                            <div style={{
                                position: "absolute",
                                bottom: 0,
                                right: -3
                            }}>
                                <Counter
                                    count={task._count?.updates}
                                    size="small"
                                    color="negative"
                                    maxDigits={2}
                                    ariaLabel={`${task._count?.updates} updates`}
                                />
                            </div>
                        </div>
                    )}
                </div>
            );

        }

        if (col.type === 'dropdown') {
            return (
                <DropdownCell
                    value={val}
                    onChange={v => handleUpdateTaskColumn(task.id, col.id, v)}
                    options={col.settings?.options ?? []}
                />
            );
        }

        if (col.type === 'timeline') {
            return (
                <TimelineCell
                    value={val}
                    onChange={v => handleUpdateTaskColumn(task.id, col.id, v)}
                />
            );
        }

        if (col.type === 'text') {
            return (
                <InlineTextCell
                    value={val}
                    onChange={v => handleUpdateTaskColumn(task.id, col.id, v)}
                    placeholder={col.title}
                />
            );
        }

        return <div className="px-2 text-gray-600 text-xs">—</div>;
    };


    // ── Row Renderer ───────────────────────────────────────────────────────────
    const renderRow = (task: Task, isSubitem = false, parentId?: string) => {
        const isExpanded = expandedTasks.has(task.id);
        const isDragging = activeDragId === task.id;

        return (
            <Fragment key={task.id}>
                <DraggableTaskRow taskId={task.id} isDragging={isDragging} isSubitem={isSubitem}>
                    {columns.map(col => (
                        <td
                            key={col.id}
                            style={{ width: widths[col.id] ?? col.width ?? 150, minWidth: 80 }}
                            className="border-r border-[#2c2d65] h-10 overflow-hidden relative"
                        >
                            {col === columns[0] && !isSubitem && (
                                <span className="absolute left-0 top-0 h-full flex items-center pl-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10">
                                    <GripVertical size={13} className="text-gray-500" />
                                </span>
                            )}
                            {renderCell(col, task, isSubitem)}
                            {col === columns[columns.length - 1] && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id, isSubitem, parentId); }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                                    title="Delete item"
                                >
                                    <Trash2 size={13} />
                                </button>
                            )}
                        </td>
                    ))}
                </DraggableTaskRow>

                {isExpanded && !isSubitem && (
                    <>
                        {task.subTasks?.map(st => renderRow(st, true, task.id))}

                        {addingSubitemFor === task.id ? (
                            <tr className="border-b border-[#2c2d65]">
                                <td colSpan={columns.length} className="py-2 px-3 pl-14">
                                    <div className="flex items-center gap-2">
                                        <TextField
                                            value={newSubitemName}
                                            onChange={setNewSubitemName}
                                            onKeyDown={(e: any) => {
                                                if (e.key === 'Enter') handleCreateSubitem(task.id);
                                                if (e.key === 'Escape') { setAddingSubitemFor(null); setNewSubitemName(''); }
                                            }}
                                            placeholder="Enter subitem name..."
                                            autoFocus
                                            size="small"
                                        />
                                        <Button onClick={() => handleCreateSubitem(task.id)} size="small">Add</Button>
                                        <IconButton
                                            icon={X as any}
                                            onClick={() => { setAddingSubitemFor(null); setNewSubitemName(''); }}
                                            size="small"
                                            kind="tertiary"
                                            ariaLabel="Cancel"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <tr className="border-b border-[#2c2d65]">
                                <td colSpan={columns.length} className="py-1 pl-14">
                                    <Button
                                        onClick={() => setAddingSubitemFor(task.id)}
                                        kind="tertiary"
                                        size="small"
                                        leftIcon={Plus as any}
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
                <Loader2 className="animate-spin mr-2" /> Loading Board...
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
            <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${selectedTaskForUpdates ? 'mr-[450px]' : ''}`}>

                {/* Header */}
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
                    {/* New Item button with dropdown */}
                    <div className="relative" ref={newItemBtnRef}>
                        <button
                            onClick={() => setIsNewItemMenuOpen(o => !o)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#e0592a] hover:bg-[#c04a22] text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Plus size={15} />
                            New Item
                            <ChevronDown size={13} className={`transition-transform ${isNewItemMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isNewItemMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 bg-[#1a1b4b] border border-[#2c2d65] rounded-lg shadow-2xl overflow-hidden min-w-[180px] z-50">
                                <button
                                    onClick={() => { setIsAddingTask(true); setIsNewItemMenuOpen(false); }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-[#2c2d65] transition-colors flex items-center gap-2 text-sm text-gray-200"
                                >
                                    <Plus size={14} className="text-[#e0592a]" /> Add Task
                                </button>
                                <button
                                    onClick={() => { setIsAddingSection(true); setIsNewItemMenuOpen(false); }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-[#2c2d65] transition-colors flex items-center gap-2 text-sm text-gray-200"
                                >
                                    <Plus size={14} className="text-blue-400" /> Add New Section
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* DnD Table */}
                <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="flex-1 overflow-auto">

                        {/* WIP section header (above table) */}
                        <div className="flex items-center border-b border-[#2c2d65] bg-[#0f102a]">
                            <button
                                onClick={() => setIsWipSectionCollapsed(c => !c)}
                                className="flex items-center gap-2 px-3 py-2 text-left hover:bg-[#1a1b4b]/40 transition-colors"
                            >
                                {isWipSectionCollapsed
                                    ? <ChevronRight size={14} className="text-[#e0592a] flex-shrink-0" />
                                    : <ChevronDown size={14} className="text-[#e0592a] flex-shrink-0" />
                                }
                                <span className="text-[#e0592a] text-sm font-semibold tracking-wide">Work in Progress</span>
                                <span className="text-gray-500 text-xs ml-1">({wipTasks.length})</span>
                            </button>
                        </div>

                        {/* Add Section input */}
                        {isAddingSection && (
                            <div className="flex flex-col gap-2 px-3 py-3 bg-[#1a1b4b]/30 border-b border-[#2c2d65]">
                                <div className="flex items-center gap-2">
                                    <input
                                        autoFocus
                                        value={newSectionName}
                                        onChange={e => setNewSectionName(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleCreateSection();
                                            if (e.key === 'Escape') { setIsAddingSection(false); setNewSectionName(''); }
                                        }}
                                        placeholder="Section name..."
                                        className="flex-1 bg-transparent border border-[#2c2d65] rounded px-2 py-1.5 text-sm text-white outline-none focus:border-[#e0592a]"
                                    />
                                    <button onClick={handleCreateSection} className="px-3 py-1.5 bg-[#e0592a] text-white text-sm rounded hover:bg-[#c04a22] transition-colors">Add</button>
                                    <button onClick={() => { setIsAddingSection(false); setNewSectionName(''); setNewSectionColor('#e0592a'); }} className="px-2 py-1 text-gray-400 hover:text-white text-sm">Cancel</button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Section color:</span>
                                    <div className="flex gap-1.5">
                                        {['#e0592a', '#00c875', '#579bfc', '#a25ddc', '#ff7575', '#ffcb00', '#ff642e', '#9aadbd', '#ffffff'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setNewSectionColor(color)}
                                                title={color}
                                                style={{ backgroundColor: color }}
                                                className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${newSectionColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-[#1a1b4b] scale-110' : ''
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs font-mono" style={{ color: newSectionColor }}>{newSectionName || 'Preview'}</span>
                                </div>
                            </div>
                        )}

                        <table className="border-collapse" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    {columns.map(col => (
                                        <th
                                            key={col.id}
                                            style={{ width: widths[col.id] ?? col.width ?? 150 }}
                                            className="relative py-2 px-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-r border-[#2c2d65] bg-[#151642] select-none"
                                        >
                                            {col.title}
                                            <div
                                                onMouseDown={e => { e.preventDefault(); startResize(col.id, e.clientX); }}
                                                className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize group/resize flex items-center justify-center hover:bg-[#e0592a]/60 transition-colors"
                                                title="Drag to resize"
                                            >
                                                <GripVertical size={10} className="text-gray-600 group-hover/resize:text-[#e0592a] opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {/* New Task Input Row */}
                                {isAddingTask && (
                                    <tr className="border-b border-[#2c2d65] bg-[#1a1b4b]/30">
                                        <td colSpan={columns.length} className="py-2 px-2.5">
                                            <div className="flex items-center gap-2">
                                                <TextField
                                                    value={newTaskName}
                                                    onChange={setNewTaskName}
                                                    onKeyDown={(e: any) => {
                                                        if (e.key === 'Enter') handleCreateTask();
                                                        if (e.key === 'Escape') { setIsAddingTask(false); setNewTaskName(''); }
                                                    }}
                                                    placeholder="Enter task name..."
                                                    autoFocus
                                                    size="medium"
                                                />
                                                <Button onClick={handleCreateTask}>Add Task</Button>
                                                <IconButton
                                                    icon={X as any}
                                                    onClick={() => { setIsAddingTask(false); setNewTaskName(''); }}
                                                    size="medium"
                                                    kind="tertiary"
                                                    ariaLabel="Cancel"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* WIP droppable zone */}
                                {!isWipSectionCollapsed && (
                                    <DroppableSection sectionId="wip" colSpan={columns.length}>
                                        {wipTasks.map(task => renderRow(task))}
                                    </DroppableSection>
                                )}
                                {isWipSectionCollapsed && wipTasks.map(task => renderRow(task))}

                                {/* Custom Sections */}
                                {customSections.map(section => {
                                    const secTasks = sectionTasks(section.id);
                                    return (
                                        <Fragment key={section.id}>
                                            <tr><td colSpan={columns.length} className="h-5 bg-[#0a0b1e] border-none" /></tr>
                                            <tr className="border-t-2 border-[#2c2d65]">
                                                <td colSpan={columns.length} className="bg-[#0f102a] py-0">
                                                    <div className="flex items-center gap-2 px-3 py-2 group">
                                                        <button
                                                            onClick={() => setCustomSections(prev => prev.map(s => s.id === section.id ? { ...s, collapsed: !s.collapsed } : s))}
                                                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                                        >
                                                            {section.collapsed
                                                                ? <ChevronRight size={14} style={{ color: section.color }} className="flex-shrink-0" />
                                                                : <ChevronDown size={14} style={{ color: section.color }} className="flex-shrink-0" />
                                                            }
                                                            <span className="text-sm font-semibold tracking-wide" style={{ color: section.color }}>{section.name}</span>
                                                            <span className="text-gray-500 text-xs">({secTasks.length})</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setCustomSections(prev => prev.filter(s => s.id !== section.id))}
                                                            className="ml-auto p-1 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                                            title="Remove section"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {!section.collapsed && (
                                                <DroppableSection sectionId={section.id} colSpan={columns.length}>
                                                    {secTasks.map(task => renderRow(task))}
                                                </DroppableSection>
                                            )}
                                        </Fragment>
                                    );
                                })}

                                {/* Empty state */}
                                {tasks.length === 0 && !isAddingTask && (
                                    <tr>
                                        <td colSpan={columns.length} className="p-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-[#1a1b4b] rounded-full flex items-center justify-center">
                                                    <Plus size={32} className="text-gray-600" />
                                                </div>
                                                <p>No items yet. Click &quot;New Item&quot; to get started!</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Spacer before Done */}
                                {doneTasks.length > 0 && (
                                    <tr><td colSpan={columns.length} className="h-6 bg-[#0a0b1e] border-none" /></tr>
                                )}

                                {/* Done Section */}
                                {doneTasks.length > 0 && (
                                    <>
                                        <tr className="border-t-2 border-[#2c2d65]">
                                            <td colSpan={columns.length} className="bg-[#0f102a] py-0">
                                                <button
                                                    onClick={() => setIsDoneSectionCollapsed(c => !c)}
                                                    className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-[#1a1b4b]/40 transition-colors"
                                                >
                                                    {isDoneSectionCollapsed
                                                        ? <ChevronRight size={14} className="text-[#00c875] flex-shrink-0" />
                                                        : <ChevronDown size={14} className="text-[#00c875] flex-shrink-0" />
                                                    }
                                                    <span className="text-[#00c875] text-sm font-semibold tracking-wide">Done</span>
                                                    <span className="text-gray-500 text-xs ml-1">({doneTasks.length})</span>
                                                </button>
                                            </td>
                                        </tr>
                                        {!isDoneSectionCollapsed && (
                                            <>
                                                <tr className="bg-[#0d0e24]">
                                                    {columns.map(col => (
                                                        <td
                                                            key={col.id}
                                                            style={{ width: widths[col.id] ?? col.width ?? 150 }}
                                                            className="py-1.5 px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide border-b border-r border-[#2c2d65]"
                                                        >
                                                            {col.title}
                                                        </td>
                                                    ))}
                                                </tr>
                                                <DroppableSection sectionId="done" colSpan={columns.length}>
                                                    {doneTasks.map(task => renderRow(task))}
                                                </DroppableSection>
                                            </>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* DragOverlay ghost */}
                    <DragOverlay dropAnimation={null}>
                        {activeDragId ? (
                            <div className="bg-[#1a1b4b] border border-[#e0592a] rounded px-4 py-2 text-white text-sm shadow-2xl opacity-90 flex items-center gap-2">
                                <GripVertical size={13} className="text-[#e0592a]" />
                                {tasks.find(t => t.id === activeDragId)?.name ?? 'Task'}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Updates Drawer */}
            <UpdatesDrawer
                task={selectedTaskForUpdates}
                onClose={() => setSelectedTaskForUpdates(null)}
            />
        </div>
    );
}

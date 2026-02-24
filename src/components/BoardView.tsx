/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Loader2, ChevronRight, ChevronDown, X, Check, GripVertical, Calendar, Trash2, Sparkles, MessageSquare } from 'lucide-react';
import { Button, TextField, EditableHeading, IconButton } from '@vibe/core';
import UpdatesDrawer from '@/components/UpdatesDrawer';
import { PortalMenu } from '@/components/PortalMenu';
import { PersonCell } from '@/components/board/cells/PersonCell';
import { motion, AnimatePresence } from 'framer-motion';

// Types
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
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                ref={btnRef}
                onClick={() => setOpen(o => !o)}
                className="w-full h-8 rounded-xl text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-lg group relative overflow-hidden"
                style={{
                    background: selected?.color
                        ? `linear-gradient(135deg, ${selected.color} 0%, ${selected.color}cc 100%)`
                        : 'var(--surface-3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                {selected?.label ?? <span className="text-gray-500 font-bold">—</span>}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <PortalMenu triggerRef={btnRef} onClose={() => setOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl min-w-[160px]"
                        >
                            <button
                                onClick={() => { onChange(''); setOpen(false); }}
                                className="w-full px-4 py-3 text-left hover:bg-white/10 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5"
                            >
                                — Protocol Clear
                            </button>
                            {options.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setOpen(false); }}
                                    className="w-full px-4 py-3 text-left hover:bg-white/10 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        {opt.color && <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: opt.color }} />}
                                        <span className="text-[12px] font-bold text-gray-200 group-hover:text-white">{opt.label}</span>
                                    </div>
                                    {value === opt.value && <Check size={14} className="text-accent-cyan" />}
                                </button>
                            ))}
                        </motion.div>
                    </PortalMenu>
                )}
            </AnimatePresence>
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
    const color = labels[value?.toLowerCase()] ?? 'var(--surface-3)';
    const label = value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Select state';

    // Special spectral gradient for "Done" or active states
    const isDone = value?.toLowerCase() === 'done';
    const isWorking = value?.toLowerCase() === 'working on it' || value?.toLowerCase() === 'wip';

    let gradient = `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`;
    if (isDone) gradient = 'var(--grad-aurora)';
    if (isWorking) gradient = 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)';

    return (
        <div className="w-full h-full flex items-center px-1">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                ref={btnRef}
                onClick={() => setOpen(o => !o)}
                className="w-full h-8 rounded-xl text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center transition-all shadow-lg group relative overflow-hidden"
                style={{
                    background: gradient,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">{label}</span>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <PortalMenu triggerRef={btnRef} onClose={() => setOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl min-w-[180px]"
                        >
                            {Object.entries(labels).map(([key, clr]) => (
                                <button
                                    key={key}
                                    onClick={() => { onChange(key); setOpen(false); }}
                                    className="w-full px-4 py-3 text-left hover:bg-white/10 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clr as string }} />
                                        <span className="text-[12px] font-black text-gray-200 group-hover:text-white uppercase tracking-tight">{key}</span>
                                    </div>
                                    {value?.toLowerCase() === key.toLowerCase() && <Check size={14} className="text-accent-cyan" />}
                                </button>
                            ))}
                        </motion.div>
                    </PortalMenu>
                )}
            </AnimatePresence>
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
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                ref={btnRef}
                onClick={() => setOpen(o => !o)}
                className="w-full h-8 rounded-xl bg-[var(--surface-3)] text-[11px] font-bold text-gray-200 flex items-center justify-center gap-2 hover:bg-white/10 transition-all px-3 border border-white/5"
            >
                <Calendar size={13} className="text-accent-indigo flex-shrink-0" />
                <span className="truncate">{displayText ?? <span className="text-gray-500">Scheduled Pulse</span>}</span>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <PortalMenu triggerRef={btnRef} onClose={() => setOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="w-72 bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-2xl shadow-2xl p-5 flex flex-col gap-4 backdrop-blur-3xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-4 bg-accent-indigo rounded-full" />
                                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Temporal Range</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest pl-1">Ingress</label>
                                    <input
                                        type="date"
                                        value={start}
                                        onChange={e => setStart(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 focus:border-accent-indigo rounded-xl px-2 py-2 text-[11px] text-white outline-none transition-all cursor-pointer"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest pl-1">Egress</label>
                                    <input
                                        type="date"
                                        value={end}
                                        min={start}
                                        onChange={e => setEnd(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 focus:border-accent-indigo rounded-xl px-2 py-2 text-[11px] text-white outline-none transition-all cursor-pointer"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={apply}
                                    disabled={!start || !end}
                                    className="flex-1 bg-accent-indigo hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-black uppercase py-2.5 rounded-xl transition-all shadow-lg"
                                >
                                    Sync Timeline
                                </motion.button>
                                <button
                                    onClick={clear}
                                    className="px-4 bg-white/5 hover:bg-white/10 text-gray-400 text-[11px] font-bold py-2.5 rounded-xl transition-all"
                                >
                                    Reset
                                </button>
                            </div>
                        </motion.div>
                    </PortalMenu>
                )}
            </AnimatePresence>
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
            <motion.input
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={() => { setEditing(false); if (draft !== value) onChange(draft); }}
                onKeyDown={e => {
                    if (e.key === 'Enter') { setEditing(false); if (draft !== value) onChange(draft); }
                    if (e.key === 'Escape') { setEditing(false); setDraft(value ?? ''); }
                }}
                placeholder={placeholder}
                className="w-full bg-black/60 border border-accent-indigo rounded-xl px-3 py-1.5 text-xs text-white outline-none ring-2 ring-indigo-500/20"
            />
        );
    }

    return (
        <div
            onClick={() => setEditing(true)}
            className="w-full h-8 flex items-center px-3 text-[13px] text-gray-300 font-medium cursor-text hover:bg-white/5 rounded-xl transition-all truncate"
        >
            {draft || <span className="text-gray-600 font-normal italic">{placeholder ?? '—'}</span>}
        </div>
    );
}

// ... existing PersonCell (kept as is)

// ─── Draggable Task Row ───────────────────────────────────────────────────────
function DraggableTaskRow({ taskId, isDragging, isSubitem, children }: {
    taskId: string;
    isDragging: boolean;
    isSubitem: boolean;
    children: React.ReactNode;
}) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: taskId, disabled: isSubitem });
    const style = transform ? { transform: CSS.Translate.toString(transform), zIndex: 50 } : undefined;

    return (
        <motion.tr
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            ref={setNodeRef}
            style={style}
            {...(isSubitem ? {} : { ...attributes, ...listeners })}
            className={`group transition-all border-b border-[var(--glass-border)] ${isDragging ? 'opacity-40 scale-[0.98] !bg-white/10' : ''} ${isSubitem ? 'bg-black/20' : ''}`}
        >
            {children}
        </motion.tr>
    );
}

// ─── Droppable Section ────────────────────────────────────────────────────────
const DroppableSection = ({ sectionId, children, colSpan }: { sectionId: string, children: React.ReactNode, colSpan: number }) => {
    const { setNodeRef, isOver } = useDroppable({ id: sectionId });

    return (
        <>
            {children}
            <tr ref={setNodeRef} className={`transition-all duration-300 ${isOver ? 'bg-accent-indigo/10' : ''}`}>
                <td colSpan={colSpan} className="p-0 border-none">
                    {isOver && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-10 bg-accent-indigo/5 border-2 border-dashed border-accent-indigo/20 rounded-xl mx-2 my-1 flex items-center justify-center"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-indigo/50">
                                Release to distribute node here
                            </span>
                        </motion.div>
                    )}
                </td>
            </tr>
        </>
    );
};

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
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
    const [wipSectionName, setWipSectionName] = useState('Active Tasks');
    const [doneSectionName, setDoneSectionName] = useState('Done');
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [sectionNameInput, setSectionNameInput] = useState('');
    const newItemBtnRef = useRef<HTMLDivElement>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const columns: Column[] = (board?.columns ?? []).filter((c: Column) => c.id !== 'updates');
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
        // If the task being edited is part of the current selection, treat it as a bulk action
        const isBulkUpdate = selectedTaskIds.has(taskId) && selectedTaskIds.size > 1;
        const targetTaskIds = isBulkUpdate ? Array.from(selectedTaskIds) : [taskId];

        // Optimistic UI updates
        setTasks(prev => prev.map(t => {
            const shouldUpdate = targetTaskIds.includes(t.id);
            const shouldUpdateSubtask = t.subTasks?.some(st => targetTaskIds.includes(st.id));

            if (!shouldUpdate && !shouldUpdateSubtask) return t;

            let updatedTask = { ...t };

            // Update parent task if needed
            if (shouldUpdate) {
                if (columnId === 'assignedUserId') {
                    const user = value ? employees.find(e => e.id === value) : null;
                    updatedTask = { ...updatedTask, assignedUserId: value, assignedUser: user };
                } else {
                    updatedTask = { ...updatedTask, parsedValues: { ...updatedTask.parsedValues, [columnId]: value } };
                }
            }

            // Update subtasks if needed
            if (t.subTasks) {
                updatedTask.subTasks = t.subTasks.map(st => {
                    if (!targetTaskIds.includes(st.id)) return st;
                    if (columnId === 'assignedUserId') {
                        const user = value ? employees.find(e => e.id === value) : null;
                        return { ...st, assignedUserId: value, assignedUser: user };
                    }
                    return { ...st, parsedValues: { ...st.parsedValues, [columnId]: value } };
                });
            }

            return updatedTask;
        }));

        // If Status changes to/from Done, update section assignment optimistically for all targets
        if (columnId === statusColId && !isBulkUpdate) {
            // Bulk section reassignment can get messy optimistically, so we only do it easily for single edits. 
            // For strictly correct bulk section moves, we'll let the user see them shift after.
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
        } else if (columnId === statusColId && isBulkUpdate) {
            const isDone = String(value).toLowerCase() === 'done';
            setTaskSections(prev => {
                const next = { ...prev };
                targetTaskIds.forEach(id => {
                    if (isDone) {
                        next[id] = 'done';
                    } else if (next[id] === 'done') {
                        delete next[id];
                    }
                });
                return next;
            });
        }

        // Send API requests in parallel
        try {
            await Promise.all(targetTaskIds.map(async id => {
                const payload = columnId === 'assignedUserId'
                    ? { assignedUserId: value }
                    : { columnValues: { [columnId]: value } };

                const res = await fetch(`/api/tasks/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error(`Failed to update ${id}`);
            }));

            // Persist selection after bulk action as requested by the user
            // so they can apply multiple changes to the same group.

        } catch (error) {
            console.error('Failed column update:', error);
            fetchData(); // Reset on failure
        }
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
                <div className={`flex items-center gap-2 h-full ${isSubitem ? 'pl-10' : 'pl-3'} pr-2 group/item`}>
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
                            className="text-left text-white text-[13px] hover:text-[#e0592a] transition-colors font-medium truncate"
                        >
                            {task.name}
                        </button>
                    )}

                    <div className="flex-1" />

                    <div className="flex items-center gap-1.5 transition-opacity">
                        <button className="text-gray-500 hover:text-yellow-400 transition-colors p-1">
                            <Sparkles size={14} />
                        </button>
                        <div
                            className="relative cursor-pointer flex items-center justify-center p-1 rounded hover:bg-[#2c2d65] transition-colors"
                            onClick={() => setSelectedTaskForUpdates(task)}
                        >
                            <MessageSquare size={14} className={(task._count?.updates ?? 0) > 0 ? 'text-blue-400' : 'text-gray-500'} />
                            {(task._count?.updates ?? 0) > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#151642] text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full border border-[#2c2d65]">
                                    {task._count?.updates}
                                </span>
                            )}
                        </div>
                    </div>
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

        if (col.type === 'status') {
            return (
                <StatusCell
                    value={val}
                    onChange={v => handleUpdateTaskColumn(task.id, col.id, v)}
                    settings={col.settings?.status || col.settings || { labels: {} }}
                />
            );
        }

        // Legacy updates column hidden by filter, logic moved to 'item' column

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
    const renderRow = (task: Task, sectionColor?: string, isSubitem = false, parentId?: string) => {
        const isExpanded = expandedTasks.has(task.id);
        const isDragging = activeDragId === task.id;

        return (
            <Fragment key={task.id}>
                <DraggableTaskRow taskId={task.id} isDragging={isDragging} isSubitem={isSubitem}>
                    {/* Checkbox column */}
                    <td className="w-10 relative bg-[#1c1d4f] border-b border-[#2c2d65]">
                        {!isSubitem && sectionColor && (
                            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: sectionColor }} />
                        )}
                        <div className="flex h-full items-center justify-center pl-1">
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className={`w-3.5 h-3.5 border rounded-sm cursor-pointer flex items-center justify-center transition-colors ${selectedTaskIds.has(task.id)
                                    ? 'bg-accent-indigo border-accent-indigo'
                                    : 'border-white/20 hover:border-white/40'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTaskIds(prev => {
                                        const next = new Set(prev);
                                        if (next.has(task.id)) {
                                            next.delete(task.id);
                                        } else {
                                            next.add(task.id);
                                        }
                                        return next;
                                    });
                                }}
                            >
                                {selectedTaskIds.has(task.id) && <Check size={10} className="text-white" />}
                            </motion.div>
                        </div>
                    </td>
                    {columns.map(col => (
                        <td
                            key={col.id}
                            style={{ width: widths[col.id] ?? col.width ?? 150, minWidth: 80 }}
                            className={`border-b border-r border-[var(--glass-border)] h-[36px] overflow-hidden relative`}
                        >
                            {col === columns[0] && !isSubitem && (
                                <span className="absolute left-0 top-0 h-full flex items-center pl-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10">
                                    <GripVertical size={13} className="text-white/40" />
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
                        {task.subTasks?.map(st => renderRow(st, sectionColor, true, task.id))}

                        {addingSubitemFor === task.id ? (
                            <tr className="border-b border-[#2c2d65]">
                                <td colSpan={columns.length + 1} className="py-2 px-3 pl-14">
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
                                <td colSpan={columns.length + 1} className="py-1 pl-14">
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

    const renderHeaderRow = (sectionTasks: Task[]) => (
        <tr className="bg-[var(--surface-1)] backdrop-blur-md group/thead sticky top-0 z-10 border-b border-[var(--glass-border)]">
            <th className="w-10 relative py-2 pl-[15px] pr-2 text-left select-none border-r border-[var(--glass-border)]">
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-3.5 h-3.5 border rounded-sm cursor-pointer flex items-center justify-center transition-colors ${sectionTasks.length > 0 && sectionTasks.every(t => selectedTaskIds.has(t.id))
                        ? 'bg-accent-indigo border-accent-indigo'
                        : 'border-white/20 hover:border-white/40'
                        }`}
                    onClick={() => {
                        const allSelected = sectionTasks.length > 0 && sectionTasks.every(t => selectedTaskIds.has(t.id));
                        setSelectedTaskIds(prev => {
                            const next = new Set(prev);
                            if (allSelected) {
                                sectionTasks.forEach(t => next.delete(t.id));
                            } else {
                                sectionTasks.forEach(t => next.add(t.id));
                            }
                            return next;
                        });
                    }}
                >
                    {sectionTasks.length > 0 && sectionTasks.every(t => selectedTaskIds.has(t.id)) && <Check size={10} className="text-white" />}
                    {sectionTasks.some(t => selectedTaskIds.has(t.id)) && !sectionTasks.every(t => selectedTaskIds.has(t.id)) && (
                        <div className="w-2 h-0.5 bg-accent-indigo rounded-full" />
                    )}
                </motion.div>
            </th>
            {columns.map(col => (
                <th
                    key={col.id}
                    style={{ width: widths[col.id] ?? col.width ?? 150 }}
                    className={`relative py-2 px-3 text-[10px] uppercase tracking-wider font-black text-white/40 border-r border-[var(--glass-border)] select-none ${col.id !== 'item' ? 'text-center' : 'text-left'}`}
                >
                    {col.title}
                    <div
                        onMouseDown={e => { e.preventDefault(); startResize(col.id, e.clientX); }}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize group/resize flex items-center justify-center hover:bg-accent-indigo/60 transition-colors z-20"
                        title="Drag to resize"
                    >
                        <div className="w-px h-1/2 bg-white/10 group-hover/resize:bg-accent-indigo transition-colors" />
                    </div>
                </th>
            ))}
        </tr>
    );

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
        <div className="flex h-full w-full bg-background overflow-hidden relative">
            <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${selectedTaskForUpdates ? 'mr-[450px]' : ''}`}>

                {/* Header Container */}
                <div className="px-8 pt-8 pb-4 flex justify-between items-start sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-[var(--glass-border)]">
                    <div className="flex-1 min-w-0 pr-4">
                        <EditableHeading
                            type="h2"
                            value={board.name}
                            onChange={handleUpdateBoardName}
                            className="!font-black !text-4xl tracking-tighter mb-3 [&_h2]:!text-white [&_input]:!text-white [&_span]:!text-white [&_h2]:!font-black"
                        />
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 bg-[#1a1b4b] px-2.5 py-1 rounded-full border border-[#2c2d65]">
                                {board.department?.name} Department
                            </span>
                        </div>
                    </div>
                    {/* New Item button with dropdown */}
                    <div className="relative" ref={newItemBtnRef}>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(224, 89, 42, 0.4)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsNewItemMenuOpen(o => !o)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#e0592a]/80 backdrop-blur-xl border border-white/20 text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:bg-[#e0592a]/90"
                        >
                            <Plus size={16} strokeWidth={3} />
                            New Item
                            <ChevronDown size={14} className={`transition-transform duration-300 ${isNewItemMenuOpen ? 'rotate-180' : ''}`} />
                        </motion.button>

                        <AnimatePresence>
                            {isNewItemMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden min-w-[200px] z-50 backdrop-blur-3xl"
                                >
                                    <button
                                        onClick={() => { setIsAddingTask(true); setIsNewItemMenuOpen(false); }}
                                        className="w-full px-5 py-3.5 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-sm text-white font-medium group"
                                    >
                                        <Plus size={16} className="text-accent-indigo group-hover:scale-110 transition-transform" /> Add Task
                                    </button>
                                    <button
                                        onClick={() => { setIsAddingSection(true); setIsNewItemMenuOpen(false); }}
                                        className="w-full px-5 py-3.5 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-sm text-white font-medium group"
                                    >
                                        <Plus size={16} className="text-accent-cyan group-hover:scale-110 transition-transform" /> Add New Section
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* DnD Table */}
                <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="flex-1 overflow-auto px-8 pt-8 pb-32">

                        {/* Add Section input */}
                        {isAddingSection && (
                            <div className="flex flex-col gap-2 px-3 py-3 bg-[#1a1b4b]/30 border-b border-[#2c2d65] mb-4 rounded-lg">
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

                        <div className="flex flex-col gap-14 pb-24">
                            {/* WIP Section Card */}
                            <div className="bg-[var(--surface-1)]/40 backdrop-blur-[24px] saturate-[180%] contrast-[95%] rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.05)] w-fit min-w-full transition-all duration-500 hover:scale-[1.002] hover:shadow-[0_30px_70px_rgba(0,0,0,0.4)] relative overflow-visible">
                                {/* Edge highlight */}
                                <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />
                                <table className="border-collapse" style={{ tableLayout: 'fixed', width: 'max-content' }}>
                                    <tbody>
                                        {/* WIP Section Header */}
                                        <tr className="border-b border-[var(--glass-border)]">
                                            <td colSpan={columns.length + 1} className="bg-transparent py-0">
                                                <div className="flex items-center gap-3 px-4 py-3.5 w-full group">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        onClick={() => setIsWipSectionCollapsed(c => !c)}
                                                        className="flex-shrink-0"
                                                    >
                                                        <ChevronRight size={18} className={`text-accent-indigo transition-transform duration-300 ${isWipSectionCollapsed ? '' : 'rotate-90'}`} />
                                                    </motion.button>

                                                    <div className="flex-1 min-w-0 vibe-header-inherit">
                                                        <EditableHeading
                                                            type="h3"
                                                            value={wipSectionName}
                                                            onChange={val => setWipSectionName(val || 'Active Tasks')}
                                                            className="!text-[#e0592a] !text-[14px] !font-bold !tracking-wide !font-outfit !overflow-visible !whitespace-normal !w-auto"
                                                        />
                                                    </div>

                                                    <span className="text-gray-500 text-[10px] font-black bg-white/5 px-2 py-0.5 rounded-full ml-2 border border-white/5">
                                                        {wipTasks.length}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>

                                        {!isWipSectionCollapsed && (
                                            <>
                                                {/* New Task Input Row */}
                                                <AnimatePresence>
                                                    {isAddingTask && (
                                                        <motion.tr
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="border-b border-[var(--glass-border)] bg-white/5"
                                                        >
                                                            <td colSpan={columns.length + 1} className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 focus-within:border-accent-indigo transition-all">
                                                                        <input
                                                                            value={newTaskName}
                                                                            onChange={e => setNewTaskName(e.target.value)}
                                                                            onKeyDown={(e: any) => {
                                                                                if (e.key === 'Enter') handleCreateTask();
                                                                                if (e.key === 'Escape') { setIsAddingTask(false); setNewTaskName(''); }
                                                                            }}
                                                                            placeholder="New Task Name..."
                                                                            autoFocus
                                                                            className="w-full bg-transparent border-none text-white outline-none text-sm placeholder:text-gray-600 font-medium"
                                                                        />
                                                                    </div>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={handleCreateTask}
                                                                        className="px-5 py-2.5 bg-accent-indigo text-white text-xs font-black rounded-xl hover:bg-accent-indigo/80 transition-all shadow-lg shadow-accent-indigo/20 uppercase tracking-widest"
                                                                    >
                                                                        Initialize
                                                                    </motion.button>
                                                                    <IconButton
                                                                        icon={X as any}
                                                                        onClick={() => { setIsAddingTask(false); setNewTaskName(''); }}
                                                                        size="medium"
                                                                        kind="tertiary"
                                                                        ariaLabel="Cancel"
                                                                    />
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    )}
                                                </AnimatePresence>

                                                {renderHeaderRow(wipTasks)}
                                                <DroppableSection sectionId="wip" colSpan={columns.length + 1}>
                                                    {wipTasks.map(task => renderRow(task, '#e0592a'))}
                                                </DroppableSection>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Custom Sections Cards */}
                            {customSections.map(section => {
                                const secTasks = sectionTasks(section.id);
                                return (
                                    <div key={section.id} className="bg-[var(--surface-1)]/40 backdrop-blur-[24px] saturate-[180%] contrast-[95%] rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.05)] w-fit min-w-full transition-all duration-500 hover:scale-[1.002] hover:shadow-[0_30px_70px_rgba(0,0,0,0.4)] relative overflow-visible">
                                        {/* Edge highlight */}
                                        <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />
                                        <table className="border-collapse" style={{ tableLayout: 'fixed', width: 'max-content' }}>
                                            <tbody>
                                                <tr className="border-b border-[var(--glass-border)]">
                                                    <td colSpan={columns.length + 1} className="bg-transparent py-0">
                                                        <div className="flex items-center group relative gap-3 px-4 py-3.5 w-full">
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                onClick={() => setCustomSections(prev => prev.map(s => s.id === section.id ? { ...s, collapsed: !s.collapsed } : s))}
                                                                className="flex-shrink-0"
                                                            >
                                                                <ChevronRight size={18} style={{ color: section.color }} className={`transition-transform duration-300 ${section.collapsed ? '' : 'rotate-90'}`} />
                                                            </motion.button>

                                                            <div className="flex-1 min-w-0 vibe-header-inherit" style={{ color: section.color }}>
                                                                <EditableHeading
                                                                    type="h3"
                                                                    value={section.name}
                                                                    onChange={val => setCustomSections(prev => prev.map(s => s.id === section.id ? { ...s, name: val || s.name } : s))}
                                                                    className="!text-inherit !text-[14px] !font-bold !tracking-wide !font-outfit !overflow-visible !whitespace-normal !w-auto"
                                                                />
                                                            </div>

                                                            <span className="text-gray-500 text-[10px] font-black bg-white/5 px-2 py-0.5 rounded-full ml-2 border border-white/5">
                                                                {secTasks.length}
                                                            </span>

                                                            <button
                                                                onClick={() => setCustomSections(prev => prev.filter(s => s.id !== section.id))}
                                                                className="absolute right-6 p-2 rounded-xl hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                                                                title="Remove section"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {!section.collapsed && (
                                                    <>
                                                        {renderHeaderRow(secTasks)}
                                                        <DroppableSection sectionId={section.id} colSpan={columns.length + 1}>
                                                            {secTasks.map(task => renderRow(task, section.color))}
                                                        </DroppableSection>
                                                    </>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}

                            {/* Done Section Card */}
                            {doneTasks.length > 0 && (
                                <div className="bg-[var(--surface-1)]/40 backdrop-blur-[24px] saturate-[180%] contrast-[95%] rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.05)] w-fit min-w-full transition-all duration-500 hover:scale-[1.002] hover:shadow-[0_30px_70px_rgba(0,0,0,0.4)] relative overflow-visible">
                                    {/* Edge highlight */}
                                    <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />
                                    <table className="border-collapse" style={{ tableLayout: 'fixed', width: 'max-content' }}>
                                        <tbody>
                                            <tr className="border-b border-[var(--glass-border)]">
                                                <td colSpan={columns.length + 1} className="bg-transparent py-0">
                                                    <div className="flex items-center gap-3 px-4 py-3.5 w-full group">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            onClick={() => setIsDoneSectionCollapsed(c => !c)}
                                                            className="flex-shrink-0"
                                                        >
                                                            <ChevronRight size={18} className={`text-accent-cyan transition-transform duration-300 ${isDoneSectionCollapsed ? '' : 'rotate-90'}`} />
                                                        </motion.button>

                                                        <div className="flex-1 min-w-0 vibe-header-inherit">
                                                            <EditableHeading
                                                                type="h3"
                                                                value={doneSectionName}
                                                                onChange={val => setDoneSectionName(val || 'Done')}
                                                                className="!text-[#00c875] !text-[14px] !font-bold !tracking-wide !font-outfit !overflow-visible !whitespace-normal !w-auto"
                                                            />
                                                        </div>

                                                        <span className="text-gray-500 text-[10px] font-black bg-white/5 px-2 py-0.5 rounded-full ml-2 border border-white/5">
                                                            {doneTasks.length}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {!isDoneSectionCollapsed && (
                                                <>
                                                    {renderHeaderRow(doneTasks)}
                                                    <DroppableSection sectionId="done" colSpan={columns.length + 1}>
                                                        {doneTasks.map(task => renderRow(task, '#00c875'))}
                                                    </DroppableSection>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Empty state wrapper */}
                            {tasks.length === 0 && !isAddingTask && (
                                <div className="p-16 text-center text-gray-500 bg-[var(--surface-1)]/50 backdrop-blur-xl rounded-2xl border border-[var(--glass-border)]">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-[#1a1b4b] rounded-full flex items-center justify-center">
                                            <Plus size={32} className="text-gray-600" />
                                        </div>
                                        <p>No items yet. Click &quot;New Item&quot; to get started!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DragOverlay ghost */}
                    <DragOverlay dropAnimation={null}>
                        {activeDragId ? (() => {
                            const task = tasks.find(t => t.id === activeDragId) || tasks.flatMap((t: Task) => t.subTasks || []).find((t: Task) => t.id === activeDragId);
                            if (!task) return null;
                            const isSubitem = tasks.flatMap((t: Task) => t.subTasks || []).some(st => st.id === activeDragId);
                            const sectionId = getTaskSection(task);
                            const customSection = customSections.find(s => s.id === sectionId);
                            const color = sectionId === 'done' ? '#00c875' : sectionId === 'wip' ? '#e0592a' : customSection?.color || '#e0592a';

                            return (
                                <div className="shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] opacity-95 backdrop-blur-3xl bg-[var(--surface-1)] border border-white/20 rounded-2xl overflow-hidden transform rotate-2 scale-[1.02] origin-top-left ring-2 ring-accent-indigo/40">
                                    <table className="border-collapse w-full" style={{ tableLayout: 'fixed' }}>
                                        <tbody>
                                            {renderRow(task, color, isSubitem)}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })() : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Updates Drawer */}
            <UpdatesDrawer
                task={selectedTaskForUpdates}
                board={board}
                onClose={() => setSelectedTaskForUpdates(null)}
            />
        </div>
    );
}

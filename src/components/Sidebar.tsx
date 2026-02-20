/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
    Briefcase,
    Table,
    Plus,
    User,
    ChevronRight,
    ChevronDown,
    LayoutDashboard,
    Trash2
} from 'lucide-react';
import {
    EditableText,
    IconButton,
    Text,
    ListItemIcon
} from '@vibe/core';
import { ListItem } from '@vibe/core/next';

// Types
interface Board {
    id: string;
    name: string;
    icon?: string;
}

interface Department {
    id: string;
    name: string;
    boards: Board[];
}

interface Organization {
    name: string;
    departments: Department[];
}

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

    // Fetch Data
    const fetchOrg = useCallback(() => {
        fetch('/api/org/me')
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error('Failed to load org');
            })
            .then((data) => {
                setOrg(data);
                // Expand all by default if not already set
                if (Object.keys(expandedDepts).length === 0 && data.departments) {
                    const expanded: Record<string, boolean> = {};
                    data.departments.forEach((d: Department) => {
                        expanded[d.id] = true;
                    });
                    setExpandedDepts(expanded);
                }
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [expandedDepts]);

    useEffect(() => {
        fetchOrg();
    }, [fetchOrg]);

    const toggleDept = (deptId: string) => {
        setExpandedDepts(prev => ({ ...prev, [deptId]: !prev[deptId] }));
    };

    // Handlers
    const handleRenameDepartment = async (deptId: string, newName: string) => {
        // Optimistic update
        const oldOrg = org;
        if (org) {
            setOrg({
                ...org,
                departments: org.departments.map(d =>
                    d.id === deptId ? { ...d, name: newName } : d
                )
            });
        }

        try {
            await fetch(`/api/departments/${deptId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });
        } catch (error) {
            console.error('Failed to rename department', error);
            setOrg(oldOrg); // Revert
        }
    };

    const handleRenameBoard = async (boardId: string, newName: string) => {
        // Optimistic update
        const oldOrg = org;
        if (org) {
            setOrg({
                ...org,
                departments: org.departments.map(d => ({
                    ...d,
                    boards: d.boards.map(b =>
                        b.id === boardId ? { ...b, name: newName } : b
                    )
                }))
            });
        }

        try {
            await fetch(`/api/boards/${boardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });
        } catch (error) {
            console.error('Failed to rename board', error);
            setOrg(oldOrg); // Revert
        }
    };

    const handleAddBoard = async (deptId: string) => {
        const newBoardName = "New Board";
        try {
            const res = await fetch('/api/boards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newBoardName, departmentId: deptId }),
            });
            if (res.ok) {
                const newBoard = await res.json();
                fetchOrg(); // Reload to get full state or manually append
                router.push(`/board/${newBoard.id}`);
            }
        } catch (error) {
            console.error('Failed to create board', error);
        }
    };

    const handleDeleteBoard = async (e: React.MouseEvent, boardId: string, deptId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this board? This action cannot be undone.')) return;

        // Optimistic update
        const oldOrg = org;
        if (org) {
            setOrg({
                ...org,
                departments: org.departments.map(d => ({
                    ...d,
                    boards: d.id === deptId ? d.boards.filter(b => b.id !== boardId) : d.boards
                }))
            });
        }

        try {
            const res = await fetch(`/api/boards/${boardId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                if (pathname === `/board/${boardId}`) {
                    router.push('/dashboard');
                }
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            console.error('Failed to delete board', error);
            setOrg(oldOrg); // Revert
        }
    };

    if (loading) return <div className="w-64 bg-[#1a1b4b] border-r border-[rgba(255,255,255,0.12)] p-4 text-white">Loading...</div>;
    if (!org) return <div className="w-64 bg-[#1a1b4b] border-r border-[rgba(255,255,255,0.12)] p-4 text-white">Error loading organization</div>;

    return (
        <div className="w-64 bg-[#1a1b4b] h-screen flex flex-col border-r border-[rgba(255,255,255,0.12)]">
            {/* Header */}
            <div className="p-4 border-b border-[rgba(255,255,255,0.12)]">
                <Text type="text1" weight="bold" className="text-white truncate">
                    {org.name}
                </Text>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                    {/* Dashboard Link */}
                    <Link href="/dashboard" className="block outline-none">
                        <ListItem
                            className={`rounded-md transition-colors text-white ${pathname === '/dashboard' ? 'bg-[#2c2d65]' : 'hover:bg-[#2c2d65]/50'}`}
                            label="Dashboard"
                            startElement={<ListItemIcon icon={LayoutDashboard as any} className="text-white h-4 w-4" />}
                        />
                    </Link>

                    <div className="mt-4" />

                    {/* Departments */}
                    {org.departments.map((dept) => (
                        <div key={dept.id} className="mb-2">
                            <div className="flex items-center group px-2 mb-1">
                                <button
                                    onClick={() => toggleDept(dept.id)}
                                    className="p-1 mr-1 hover:bg-white/10 rounded text-gray-400"
                                >
                                    {expandedDepts[dept.id] ?
                                        <ChevronDown size={14} /> :
                                        <ChevronRight size={14} />
                                    }
                                </button>

                                <div className="flex-1 flex items-center min-w-0">
                                    <Briefcase size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <EditableText
                                            value={dept.name}
                                            onChange={(val: string) => handleRenameDepartment(dept.id, val)}
                                            type="text2"
                                            weight="medium"
                                            className="w-full [&_div]:!text-white [&_input]:!text-white [&_span]:!text-white"
                                        />
                                    </div>
                                </div>

                                <IconButton
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    icon={Plus as any}
                                    size="small"
                                    kind="tertiary"
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                                    onClick={() => handleAddBoard(dept.id)}
                                    ariaLabel="Add Board"
                                />
                            </div>

                            {expandedDepts[dept.id] && (
                                <div className="pl-6 space-y-1">
                                    {dept.boards.map((board) => (
                                        <div
                                            key={board.id}
                                            className={`
                                                group flex items-center px-2 py-1.5 rounded-md cursor-pointer transition-colors
                                                ${pathname === `/board/${board.id}` ? 'bg-[#2c2d65] text-white' : 'text-white hover:bg-[#2c2d65]/30'}
                                            `}
                                            onClick={(e) => {
                                                // Prevent navigation if clicking inside EditableText (handled by bubbling check or just separate areas)
                                                // Simplest is to let EditableText handle clicks for edit, and use a Link wrapper or onClick for nav
                                                // But EditableText inside Link is bad.
                                                // We'll use router.push if target is not input
                                                if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                                                    router.push(`/board/${board.id}`);
                                                }
                                            }}
                                        >
                                            <Table size={14} className="mr-2 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <EditableText
                                                    value={board.name}
                                                    onChange={(val: string) => handleRenameBoard(board.id, val)}
                                                    type="text2"
                                                    className="w-full [&_div]:!text-white [&_input]:!text-white [&_span]:!text-white"
                                                />
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteBoard(e, board.id, dept.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all ml-1 shrink-0"
                                                title="Delete Board"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-[rgba(255,255,255,0.12)]">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#e0592a] flex items-center justify-center text-white font-bold">
                        <User size={16} />
                    </div>
                    <div>
                        <Text type="text2" className="text-white">Logged In</Text>
                    </div>
                </div>
            </div>
        </div>
    );
}

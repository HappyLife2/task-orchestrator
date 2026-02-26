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
    ChevronDown,
    LayoutDashboard,
    Trash2,
    LogOut,
    Key,
    Eye,
    EyeOff,
    Search,
    SearchX
} from 'lucide-react';
import {
    EditableText,
    IconButton,
    Text,
    ListItemIcon,
} from '@vibe/core';
import { ListItem, Modal, ModalHeader, ModalContent, ModalFooter, ModalBasicLayout } from '@vibe/core/next';
import { motion, AnimatePresence } from 'framer-motion';

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
    currentUserRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | 'USER';
    currentUserName: string;
}

const itemVariants: any = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "circOut" } }
};

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
    const [boardToDelete, setBoardToDelete] = useState<{ id: string, name: string, deptId: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deptToDelete, setDeptToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isDeletingDept, setIsDeletingDept] = useState(false);

    // Password Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [pwdError, setPwdError] = useState('');
    const [pwdSuccess, setPwdSuccess] = useState('');
    const [isChangingPwd, setIsChangingPwd] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);

    // Sidebar Resize State
    const [sidebarWidth, setSidebarWidth] = useState(256);
    const [isResizing, setIsResizing] = useState(false);

    // Persist and Restore width
    useEffect(() => {
        const savedWidth = localStorage.getItem('sidebar-width');
        if (savedWidth) {
            setSidebarWidth(parseInt(savedWidth, 10));
        }
    }, []);

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = e.clientX;
            if (newWidth >= 200 && newWidth <= 450) {
                setSidebarWidth(newWidth);
                localStorage.setItem('sidebar-width', newWidth.toString());
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

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
            .catch((err) => {
                console.error(err);
                if (err.message === 'Unauthorized') {
                    router.push('/login');
                }
            })
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
            setOrg(oldOrg);
        }
    };

    const handleRenameBoard = async (boardId: string, newName: string) => {
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
            setOrg(oldOrg);
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
                fetchOrg();
                router.push(`/board/${newBoard.id}`);
            }
        } catch (error) {
            console.error('Failed to create board', error);
        }
    };

    const confirmDeleteBoard = async () => {
        if (!boardToDelete) return;

        setIsDeleting(true);
        const { id: boardId, deptId } = boardToDelete;

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
            setOrg(oldOrg);
        } finally {
            setIsDeleting(false);
            setBoardToDelete(null);
        }
    };

    const handleDeleteBoard = async (e: React.MouseEvent, boardId: string, deptId: string) => {
        e.stopPropagation();
        setBoardToDelete({ id: boardId, name: org?.departments.find(d => d.id === deptId)?.boards.find(b => b.id === boardId)?.name || 'Board', deptId });
    };

    const confirmDeleteDepartment = async () => {
        if (!deptToDelete) return;

        setIsDeletingDept(true);
        const { id: deptId } = deptToDelete;

        const oldOrg = org;
        if (org) {
            setOrg({
                ...org,
                departments: org.departments.filter(d => d.id !== deptId)
            });
        }

        try {
            const res = await fetch(`/api/departments/${deptId}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                throw new Error('Failed to delete department');
            }
        } catch (error) {
            console.error('Failed to delete department', error);
            setOrg(oldOrg);
        } finally {
            setIsDeletingDept(false);
            setDeptToDelete(null);
        }
    };

    const handleDeleteDepartment = async (e: React.MouseEvent, deptId: string) => {
        e.stopPropagation();
        setDeptToDelete({ id: deptId, name: org?.departments.find(d => d.id === deptId)?.name || 'Department' });
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            router.push('/login');
            router.refresh();
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwdError('');
        setPwdSuccess('');

        if (newPassword.trim() !== confirmPassword.trim()) {
            setPwdError('New passwords do not match');
            return;
        }

        setIsChangingPwd(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword: newPassword.trim() })
            });
            const data = await res.json();

            if (!res.ok) {
                setPwdError(data.error || 'Failed to change password');
            } else {
                setPwdSuccess('Password changed successfully!');
                setTimeout(() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowCurrentPwd(false);
                    setShowNewPwd(false);
                    setShowConfirmPwd(false);
                    setPwdSuccess('');
                }, 2000);
            }
        } catch (err) {
            setPwdError('An error occurred. Please try again.');
        } finally {
            setIsChangingPwd(false);
        }
    };

    const handleSearch = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.results || []);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        if (!showSearchModal) {
            setSearchQuery('');
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(() => {
            if (searchQuery) handleSearch(searchQuery);
            else setSearchResults([]);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch, showSearchModal]);

    // Calculate Password Strength
    const getPasswordStrength = (pwd: string) => {
        let score = 0;
        if (!pwd) return score;
        if (pwd.length > 5) score += 1;
        if (pwd.length > 8) score += 1;
        if (/[A-Z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score += 1;
        return score;
    };

    const strength = getPasswordStrength(newPassword);
    const strengthColors = ['bg-gray-700', 'bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-emerald-500'];
    const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'];

    if (loading) return <div style={{ width: `${sidebarWidth}px` }} className="bg-background border-r border-[var(--glass-border)] p-4 text-white flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent-indigo border-t-transparent rounded-full animate-spin" /></div>;
    if (!org) return <div style={{ width: `${sidebarWidth}px` }} className="bg-background border-r border-[var(--glass-border)] p-4 text-white">Error loading organization</div>;

    return (
        <div
            style={{ width: `${sidebarWidth}px`, transition: isResizing ? 'none' : 'width 0.2s ease-out' }}
            className={`bg-[#1c1f3b] h-screen flex flex-col border-r border-white/5 relative ${isResizing ? 'select-none' : ''} font-inter`}
        >
            {/* Resize Handle */}
            <div
                onMouseDown={startResizing}
                className={`
                    absolute top-0 -right-1 w-2 h-full cursor-col-resize hover:bg-accent-indigo/30 transition-colors z-50
                    ${isResizing ? 'bg-accent-indigo/50' : ''}
                `}
            />
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <Text type="text1" weight="bold" className="text-white truncate tracking-tight uppercase !text-[14px] !font-black !tracking-widest">
                    {org.name}
                </Text>
                <IconButton
                    icon={Search as any}
                    size="small"
                    kind="tertiary"
                    className="text-gray-400 hover:text-white transition-all opacity-60 hover:opacity-100"
                    onClick={() => setShowSearchModal(true)}
                    ariaLabel="Search"
                />
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-3 space-y-6">
                <div className="space-y-2">
                    {/* Dashboard Link - Only for Non-USER/MEMBER roles */}
                    {['ADMIN', 'OWNER'].includes(org.currentUserRole) && (
                        <Link href="/dashboard" className="block outline-none relative no-underline group">
                            <motion.div
                                whileHover={{ backgroundColor: pathname === '/dashboard' ? '#1c3fa3' : 'rgba(255,255,255,0.03)' }}
                                className={`
                                    flex items-center px-4 py-2 my-0.5 rounded-lg transition-all duration-200 cursor-pointer
                                    ${pathname === '/dashboard' ? 'bg-[#1c3fa3] text-white' : 'text-gray-400 hover:text-gray-200'}
                                `}
                            >
                                <LayoutDashboard size={18} className={`mr-3 flex-shrink-0 ${pathname === '/dashboard' ? 'text-white' : 'text-gray-400'}`} />
                                <span className={`text-[13px] font-normal tracking-wide ${pathname === '/dashboard' ? 'text-white' : 'text-gray-400'}`}>
                                    Dashboard and reporting
                                </span>
                            </motion.div>
                        </Link>
                    )}

                    <div className="h-px bg-[var(--glass-border)] mx-4 my-6 opacity-30" />

                    {/* Departments */}
                    <div className="space-y-4">
                        {org.departments.map((dept) => (
                            <div key={dept.id} className="space-y-1">
                                <div className="flex items-center group px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleDept(dept.id)}>
                                    <motion.div
                                        animate={{ rotate: expandedDepts[dept.id] ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-gray-500 mr-2"
                                    >
                                        <ChevronDown size={14} />
                                    </motion.div>

                                    <div className="flex-1 flex items-center min-w-0">
                                        <Briefcase size={16} className={`${expandedDepts[dept.id] ? 'text-accent-violet' : 'text-gray-500'} mr-2.5 flex-shrink-0 transition-colors`} />
                                        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                            {['ADMIN', 'OWNER'].includes(org.currentUserRole) ? (
                                                <EditableText
                                                    value={dept.name}
                                                    onChange={(val: string) => handleRenameDepartment(dept.id, val)}
                                                    type="text2"
                                                    weight="bold"
                                                    className="w-full [&_div]:!text-gray-300 [&_input]:!text-white [&_span]:!text-white !text-[13px] !font-bold !tracking-wider uppercase"
                                                />
                                            ) : (
                                                <Text type="text2" weight="bold" className="text-gray-300 truncate pr-2 !text-[13px] !font-bold !tracking-wider uppercase">
                                                    {dept.name}
                                                </Text>
                                            )}
                                        </div>
                                    </div>

                                    {['ADMIN', 'OWNER'].includes(org.currentUserRole) && (
                                        <>
                                            <IconButton
                                                icon={Plus as any}
                                                size="small"
                                                kind="tertiary"
                                                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-all scale-75"
                                                onClick={(e) => { e.stopPropagation(); handleAddBoard(dept.id); }}
                                                ariaLabel="Add Board"
                                            />
                                            <IconButton
                                                icon={Trash2 as any}
                                                size="small"
                                                kind="tertiary"
                                                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all scale-75"
                                                onClick={(e) => handleDeleteDepartment(e, dept.id)}
                                                ariaLabel="Delete Department"
                                            />
                                        </>
                                    )}
                                </div>

                                <AnimatePresence initial={false}>
                                    {expandedDepts[dept.id] && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "circOut" }}
                                            className="overflow-hidden pl-7 space-y-1"
                                        >
                                            {dept.boards.map((board) => (
                                                <motion.div
                                                    layout
                                                    key={board.id}
                                                    variants={itemVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="hidden"
                                                    className={`
                                                        group flex items-center px-4 py-2 my-0.5 rounded-lg cursor-pointer transition-all duration-200 relative
                                                        ${pathname === `/board/${board.id}` ? 'bg-[#1c3fa3] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}
                                                    `}
                                                    onClick={(e) => {
                                                        if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                                                            router.push(`/board/${board.id}`);
                                                        }
                                                    }}
                                                >
                                                    <Table size={18} className={`mr-3 flex-shrink-0 ${pathname === `/board/${board.id}` ? 'text-white' : 'text-gray-400'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        {['ADMIN', 'OWNER'].includes(org.currentUserRole) ? (
                                                            <EditableText
                                                                value={board.name}
                                                                onChange={(val: string) => handleRenameBoard(board.id, val)}
                                                                type="text2"
                                                                weight="normal"
                                                                className="w-full [&_div]:!text-inherit [&_input]:!text-white [&_span]:!text-inherit !text-[13px] !font-normal !tracking-wide"
                                                            />
                                                        ) : (
                                                            <Text
                                                                type="text2"
                                                                weight="normal"
                                                                className={`truncate pr-2 !text-[13px] !font-normal !tracking-wide ${pathname === `/board/${board.id}` ? 'text-white' : 'text-inherit'}`}
                                                            >
                                                                {board.name}
                                                            </Text>
                                                        )}
                                                    </div>
                                                    {['ADMIN', 'OWNER'].includes(org.currentUserRole) && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteBoard(e, board.id, dept.id); }}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all ml-1 shrink-0"
                                                            title="Delete Board"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Footer */}
            <div className="p-6 border-t border-[var(--glass-border)] bg-black/20 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--grad-aurora)] p-[1px]">
                        <div className="w-full h-full bg-[#03030b] rounded-2xl flex items-center justify-center text-white">
                            <User size={18} className="text-accent-indigo" />
                        </div>
                    </div>
                    <div>
                        <Text type="text2" weight="bold" className="text-white !text-[14px] !font-bold !tracking-tight">{org.currentUserName}</Text>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.1em]">Online</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center group"
                        title="Sign Out"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center group"
                        title="Change Password"
                    >
                        <Key size={18} className="transition-transform group-hover:scale-110" />
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {boardToDelete && (
                    <Modal
                        id="delete-board-modal"
                        show={!!boardToDelete}
                        alertModal
                        size="medium"
                        onClose={() => !isDeleting && setBoardToDelete(null)}
                    >
                        <ModalBasicLayout>
                            <ModalHeader title="Delete Sequence" />
                            <ModalContent>
                                <Text type="text1" element="p" className="text-slate-700">
                                    Confirm destruction of archive <span className="text-red-400 font-bold">&quot;{boardToDelete?.name}&quot;</span>. This protocol is irreversible.
                                </Text>
                            </ModalContent>
                        </ModalBasicLayout>
                        <ModalFooter
                            primaryButton={{
                                text: isDeleting ? "Destructing..." : "Confirm Protocol",
                                color: "negative",
                                onClick: confirmDeleteBoard
                            }}
                            secondaryButton={{
                                text: "Abort",
                                onClick: () => !isDeleting && setBoardToDelete(null)
                            }}
                        />
                    </Modal>
                )}
                {deptToDelete && (
                    <Modal
                        id="delete-dept-modal"
                        show={!!deptToDelete}
                        alertModal
                        size="medium"
                        onClose={() => !isDeletingDept && setDeptToDelete(null)}
                    >
                        <ModalBasicLayout>
                            <ModalHeader title="Delete Department" />
                            <ModalContent>
                                <Text type="text1" element="p" className="text-slate-700">
                                    Confirm destruction of department <span className="text-red-400 font-bold">&quot;{deptToDelete?.name}&quot;</span>. This protocol is irreversible and will delete all associated boards!
                                </Text>
                            </ModalContent>
                        </ModalBasicLayout>
                        <ModalFooter
                            primaryButton={{
                                text: isDeletingDept ? "Destructing..." : "Confirm Protocol",
                                color: "negative",
                                onClick: confirmDeleteDepartment
                            }}
                            secondaryButton={{
                                text: "Abort",
                                onClick: () => !isDeletingDept && setDeptToDelete(null)
                            }}
                        />
                    </Modal>
                )}
            </AnimatePresence>

            {/* Change Password Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <Modal
                        id="change-password-modal"
                        show={showPasswordModal}
                        size="medium"
                        onClose={() => !isChangingPwd && setShowPasswordModal(false)}
                    >
                        <ModalBasicLayout className="!bg-[#0d0e26] !border-none !shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden">
                            <div className="absolute inset-0 bg-[var(--grad-surface)] pointer-events-none opacity-50" />
                            <div className="relative z-10 p-2">
                                <ModalHeader title="Secure Account" className="[&_h2]:!text-2xl [&_h2]:!font-black [&_h2]:!tracking-tight [&_h2]:!text-transparent [&_h2]:!bg-clip-text [&_h2]:!bg-gradient-to-r [&_h2]:from-indigo-400 [&_h2]:to-purple-400" />
                                <ModalContent>
                                    <form id="change-pwd-form" onSubmit={handleChangePassword} className="space-y-6 py-4">
                                        {pwdError && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2 backdrop-blur-md">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                                {pwdError}
                                            </motion.div>
                                        )}
                                        {pwdSuccess && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm flex items-center gap-2 backdrop-blur-md">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                {pwdSuccess}
                                            </motion.div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Current Authorization Key</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                                                    <User size={16} />
                                                </div>
                                                <input
                                                    type={showCurrentPwd ? "text" : "password"}
                                                    required
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full rounded-xl border border-white/10 bg-black/20 text-white pl-10 pr-12 py-3.5 focus:border-indigo-500 focus:bg-indigo-500/5 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all placeholder:text-gray-600"
                                                    placeholder="Enter current password"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-1 px-3 flex items-center text-gray-500 hover:text-white transition-colors"
                                                    onMouseDown={() => setShowCurrentPwd(true)}
                                                    onMouseUp={() => setShowCurrentPwd(false)}
                                                    onMouseLeave={() => setShowCurrentPwd(false)}
                                                >
                                                    {showCurrentPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">New Security Key</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors">
                                                    <Key size={16} />
                                                </div>
                                                <input
                                                    type={showNewPwd ? "text" : "password"}
                                                    required
                                                    minLength={6}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full rounded-xl border border-white/10 bg-black/20 text-white pl-10 pr-12 py-3.5 focus:border-purple-500 focus:bg-purple-500/5 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all placeholder:text-gray-600"
                                                    placeholder="Must be at least 6 characters"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-1 px-3 flex items-center text-gray-500 hover:text-white transition-colors"
                                                    onMouseDown={() => setShowNewPwd(true)}
                                                    onMouseUp={() => setShowNewPwd(false)}
                                                    onMouseLeave={() => setShowNewPwd(false)}
                                                >
                                                    {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            {/* Dynamic Strength Meter */}
                                            {newPassword && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-2 px-1">
                                                    <div className="flex gap-1.5 mb-1.5">
                                                        {[1, 2, 3, 4].map(level => (
                                                            <div key={level} className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${strength >= level ? strengthColors[strength] : 'bg-transparent'} transition-all duration-300 w-full`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <span className={`text-[10px] font-bold tracking-wider uppercase ${strengthColors[strength].replace('bg-', 'text-')}`}>
                                                            {strengthLabels[strength]}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Confirm Security Key</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-emerald-400 transition-colors">
                                                    <Key size={16} />
                                                </div>
                                                <input
                                                    type={showConfirmPwd ? "text" : "password"}
                                                    required
                                                    minLength={6}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className={`w-full rounded-xl border ${confirmPassword.trim() && newPassword.trim() !== confirmPassword.trim() ? 'border-red-500/50 bg-red-500/5 focus:ring-red-500/10' : 'border-white/10 bg-black/20 focus:border-emerald-500 focus:bg-emerald-500/5 focus:ring-emerald-500/10'} text-white pl-10 pr-12 py-3.5 focus:ring-4 focus:outline-none transition-all placeholder:text-gray-600`}
                                                    placeholder="Match new password"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-1 px-3 flex items-center text-gray-500 hover:text-white transition-colors"
                                                    onMouseDown={() => setShowConfirmPwd(true)}
                                                    onMouseUp={() => setShowConfirmPwd(false)}
                                                    onMouseLeave={() => setShowConfirmPwd(false)}
                                                >
                                                    {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Custom Footer inside Content for Better Styling */}
                                        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-white/5">
                                            <button
                                                type="button"
                                                onClick={() => !isChangingPwd && setShowPasswordModal(false)}
                                                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isChangingPwd || strength === 0 || newPassword.trim() !== confirmPassword.trim()}
                                                className="relative group overflow-hidden px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <div className="absolute inset-0 bg-[var(--grad-aurora)] opacity-80 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                                <span className="relative z-10 flex items-center gap-2">
                                                    {isChangingPwd ? (
                                                        <>
                                                            <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                                            Encrypting...
                                                        </>
                                                    ) : "Update Password"}
                                                </span>
                                            </button>
                                        </div>
                                    </form>
                                </ModalContent>
                            </div>
                        </ModalBasicLayout>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Search Modal */}
            <AnimatePresence>
                {showSearchModal && (
                    <Modal
                        id="global-search-modal"
                        show={showSearchModal}
                        size="medium"
                        onClose={() => setShowSearchModal(false)}
                    >
                        <ModalBasicLayout className="!bg-[#0f1126] !border-none !shadow-[0_0_80px_rgba(99,102,241,0.2)] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                            <div className="relative z-10 p-2">
                                <ModalHeader title="Global Search" className="[&_h2]:!text-2xl [&_h2]:!font-black [&_h2]:!tracking-tight [&_h2]:!text-transparent [&_h2]:!bg-clip-text [&_h2]:!bg-gradient-to-r [&_h2]:from-indigo-400 [&_h2]:to-purple-400" />
                                <ModalContent>
                                    <div className="space-y-6 py-4">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                                                <Search size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                autoFocus
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full rounded-2xl border border-white/10 bg-black/40 text-white pl-12 pr-4 py-4 focus:border-indigo-500/50 focus:bg-indigo-500/5 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all text-lg placeholder:text-gray-600 shadow-2xl"
                                                placeholder="Search tasks, reference IDs, or boards..."
                                            />
                                            {isSearching && (
                                                <div className="absolute inset-y-0 right-4 flex items-center">
                                                    <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {searchResults.length > 0 ? (
                                                <div className="grid gap-2">
                                                    {searchResults.map((result) => (
                                                        <motion.div
                                                            key={result.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                                            onClick={() => {
                                                                setShowSearchModal(false);
                                                                router.push(`/board/${result.boardId}?highlight=${result.id}`);
                                                            }}
                                                            className="p-4 rounded-xl border border-white/5 bg-white/5 cursor-pointer transition-all flex items-center justify-between group"
                                                        >
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-white font-bold text-sm tracking-tight group-hover:text-indigo-300 transition-colors">
                                                                        {result.name}
                                                                    </span>
                                                                    {result.referenceId && (
                                                                        <span className="text-[10px] font-black bg-white/10 text-gray-400 px-2 py-0.5 rounded-full tracking-widest uppercase">
                                                                            {result.referenceId}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                                                                    <Table size={12} />
                                                                    <span>{result.board?.name || 'Board'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ChevronDown size={18} className="-rotate-90 text-indigo-400" />
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            ) : searchQuery.length >= 2 && !isSearching ? (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3"
                                                >
                                                    <SearchX size={48} className="opacity-20" />
                                                    <p className="text-sm font-bold tracking-tight">No signals detected for &quot;{searchQuery}&quot;</p>
                                                    <p className="text-xs opacity-60">Try a different archive key or reference ID</p>
                                                </motion.div>
                                            ) : !searchQuery && (
                                                <div className="flex flex-col items-center justify-center py-12 text-gray-600 gap-3">
                                                    <Search size={48} className="opacity-10" />
                                                    <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40 text-center">
                                                        Enter sequence to begin <br /> global cross-reference
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </ModalContent>
                            </div>
                        </ModalBasicLayout>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}

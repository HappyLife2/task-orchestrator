'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Folder, Hash, ChevronRight, ChevronDown, User } from 'lucide-react';

// Types
interface Board {
    id: string;
    name: string;
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
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetch('/api/org/me')
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error('Failed to load org');
            })
            .then((data) => {
                setOrg(data);
                // Expand all by default
                const expanded: Record<string, boolean> = {};
                data.departments?.forEach((d: Department) => {
                    expanded[d.id] = true;
                });
                setExpandedDepts(expanded);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const toggleDept = (deptId: string) => {
        setExpandedDepts(prev => ({ ...prev, [deptId]: !prev[deptId] }));
    };

    if (loading) return <div className="w-64 bg-[#1a1b4b] border-r border-[rgba(255,255,255,0.12)] p-4 text-white">Loading...</div>;
    if (!org) return <div className="w-64 bg-[#1a1b4b] border-r border-[rgba(255,255,255,0.12)] p-4 text-white">Error loading organization</div>;

    return (
        <div className="w-64 bg-[#1a1b4b] border-r border-[rgba(255,255,255,0.12)] flex flex-col h-screen text-white">
            <div className="p-4 border-b border-[rgba(255,255,255,0.12)]">
                <h1 className="text-xl font-bold truncate">{org.name}</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <Link href="/dashboard" className={`flex items-center space-x-2 p-2 rounded hover:bg-[#2c2d65] ${pathname === '/dashboard' ? 'bg-[#2c2d65]' : ''}`}>
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </Link>

                <div className="space-y-2">
                    {org.departments.map((dept) => (
                        <div key={dept.id}>
                            <button
                                onClick={() => toggleDept(dept.id)}
                                className="flex items-center w-full space-x-2 p-2 rounded hover:bg-[#2c2d65]/50 text-gray-300 hover:text-white"
                            >
                                {expandedDepts[dept.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <Folder size={16} />
                                <span className="font-medium text-sm">{dept.name}</span>
                            </button>

                            {expandedDepts[dept.id] && (
                                <div className="ml-6 mt-1 space-y-1">
                                    {dept.boards.map((board) => (
                                        <Link
                                            key={board.id}
                                            href={`/board/${board.id}`}
                                            className={`flex items-center space-x-2 p-2 rounded text-sm hover:bg-[#2c2d65] ${pathname === `/board/${board.id}` ? 'bg-[#2c2d65] text-white' : 'text-gray-400'}`}
                                        >
                                            <Hash size={14} />
                                            <span className="truncate">{board.name}</span>
                                        </Link>
                                    ))}
                                    {/* Add Board button could go here */}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t border-[rgba(255,255,255,0.12)]">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <div className="w-8 h-8 rounded-full bg-[#e0592a] flex items-center justify-center text-white font-bold">
                        <User size={16} />
                    </div>
                    <div>
                        <p className="text-white">Logged In</p>
                        {/* Logout button? */}
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Modal } from '@vibe/core';
import { Search, X, Building2, Crown } from 'lucide-react';
import clsx from 'clsx';

interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    position?: string;
}

interface BoardMember {
    id: string;
    role: string;
    user: User;
}

interface BoardInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    boardId: string;
    currentUser: { id: string; role: string; name: string; position?: string; organization?: { name: string } };
}

export default function BoardInviteModal({ isOpen, onClose, boardId, currentUser }: BoardInviteModalProps) {
    const [members, setMembers] = useState<BoardMember[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchMembers();
            fetchAllUsers();
        }
    }, [isOpen, boardId]);

    const fetchMembers = async () => {
        try {
            const res = await fetch(`/api/boards/${boardId}/members`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
            }
        } catch (error) {
            console.error('Failed to fetch members', error);
        }
    };

    const fetchAllUsers = async () => {
        // We'll mock hitting an endpoint or create a real one later
        try {
            const res = await fetch('/api/org/users'); // we need to create this!
            if (res.ok) {
                const data = await res.json();
                setAllUsers(data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleInvite = async (userId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/boards/${boardId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: 'MEMBER' })
            });
            if (res.ok) {
                fetchMembers();
            }
        } catch (error) {
            console.error('Failed to invite user', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (userId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/boards/${boardId}/members?userId=${userId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchMembers();
            }
        } catch (error) {
            console.error('Failed to remove user', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = allUsers.filter(u =>
        (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (u.position?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ).filter(u => !members.find(m => m.user.id === u.id));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-[500px] h-[600px] bg-[#292f4c] rounded-lg shadow-xl flex flex-col overflow-hidden text-[#d1d4e3]">
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <h2 className="text-xl font-semibold text-white">Invite to this board</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex flex-col h-full overflow-hidden">
                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search by name, position, or email address"
                            className="w-full bg-[#1e233a] border border-white/10 rounded-md py-2.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-300 mb-6 bg-white/5 py-2 px-3 rounded-md">
                        <Building2 className="w-4 h-4" />
                        <span>Anyone at {currentUser?.organization?.name || 'this Organization'} can access this board</span>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-4">People invited to this board</h3>

                    {/* Member List */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {members.map(member => (
                            <div key={member.id} className="flex justify-between items-center p-2 rounded-md hover:bg-white/5 group">
                                <div className="flex items-center gap-3">
                                    {member.user.avatarUrl ? (
                                        <img src={member.user.avatarUrl} alt={member.user.name} className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                                            {member.user.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm text-white font-medium">{member.user.name}</span>
                                        <span className="text-xs text-gray-400">{member.user.position || member.user.email}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {member.role === 'ADMIN' && <Crown className="w-4 h-4 text-blue-400" />}
                                    {currentUser.role === 'ADMIN' && (
                                        <button
                                            onClick={() => handleRemove(member.user.id)}
                                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-red-400"
                                            title="Remove member"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Search Results / Invite Suggestions */}
                        {searchQuery && filteredUsers.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Suggestions</h3>
                                {filteredUsers.map(user => (
                                    <div key={user.id} className="flex justify-between items-center p-2 rounded-md hover:bg-white/5 cursor-pointer" onClick={() => handleInvite(user.id)}>
                                        <div className="flex items-center gap-3">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 font-medium text-sm">
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-sm text-white">{user.name}</span>
                                                <span className="text-xs text-gray-400">{user.position || user.email}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-blue-400 font-medium">Invite</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

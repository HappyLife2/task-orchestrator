/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@vibe/core';
import ActivityPanel from './updates/ActivityPanel';
import { ActivityUpdate } from './updates/ActivityItem';

interface Task {
    id: string;
    name: string;
}

interface UpdatesDrawerProps {
    task: Task | null;
    board?: any;
    onClose: () => void;
}

export default function UpdatesDrawer({ task, board, onClose }: UpdatesDrawerProps) {
    const [updates, setUpdates] = useState<ActivityUpdate[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatarUrl?: string } | null>(null);

    // Fetch current user
    useEffect(() => {
        fetch('/api/auth/me').then(async res => {
            if (res.ok) {
                const data = await res.json();
                setCurrentUser(data);
            } else {
                // Fallback for demo if auth api is different or restricted
                // We'll try another one or just set a dummy if it fails in dev
                // Trying /api/employees to match email?
                // Let's assume there's a way. For now, if failed, we might default to "Me"
                setCurrentUser({ id: 'me', name: 'Me' });
            }
        }).catch(() => setCurrentUser({ id: 'me', name: 'Me' }));
    }, []);

    // Fetch updates when task changes
    useEffect(() => {
        if (task) {
            setLoading(true);
            fetch(`/api/tasks/${task.id}/updates`)
                .then(res => res.json())
                .then(data => setUpdates(Array.isArray(data) ? data : []))
                .finally(() => setLoading(false));
        }
    }, [task]);

    const handlePostUpdate = async (content: string) => {
        if (!task) return;
        try {
            const res = await fetch(`/api/tasks/${task.id}/updates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (res.ok) {
                const update = await res.json();
                setUpdates(prev => [update, ...prev]);
            }
        } catch (error) {
            console.error('Failed to post update:', error);
        }
    };

    const handleReply = async (parentId: string, content: string) => {
        if (!task) return;
        try {
            const res = await fetch(`/api/tasks/${task.id}/updates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, parentId })
            });

            if (res.ok) {
                const reply = await res.json();
                setUpdates(prev => prev.map(u =>
                    u.id === parentId
                        ? { ...u, replies: [...(u.replies || []), reply] }
                        : u
                ));
            }
        } catch (error) {
            console.error('Failed to post reply:', error);
        }
    };

    const handleReaction = async (updateId: string, emoji: string) => {
        // Optimistic update
        setUpdates(prev => prev.map(u => {
            if (u.id !== updateId) return u;

            // const existingReaction = u.reactions?.find(r => r.emoji === emoji);
            // const userReactedWithThis = u.myReaction === emoji;
            const userReactedWithOther = u.myReaction && u.myReaction !== emoji;

            let newReactions = [...(u.reactions || [])];

            if (u.myReaction === emoji) {
                // Remove reaction
                newReactions = newReactions.map(r =>
                    r.emoji === emoji ? { ...r, count: r.count - 1, reactedByMe: false } : r
                ).filter(r => r.count > 0);
                return { ...u, reactions: newReactions, myReaction: null };
            } else {
                // Add new reaction
                if (userReactedWithOther && u.myReaction) {
                    newReactions = newReactions.map(r =>
                        r.emoji === u.myReaction ? { ...r, count: r.count - 1, reactedByMe: false } : r
                    ).filter(r => r.count > 0);
                }

                const existing = newReactions.find(r => r.emoji === emoji);
                if (existing) {
                    newReactions = newReactions.map(r =>
                        r.emoji === emoji ? { ...r, count: r.count + 1, reactedByMe: true } : r
                    );
                } else {
                    newReactions.push({ emoji, count: 1, reactedByMe: true });
                }

                return { ...u, reactions: newReactions, myReaction: emoji };
            }
        }));

        try {
            const res = await fetch(`/api/updates/${updateId}/reactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emoji })
            });
            if (!res.ok) throw new Error('Failed to react');
        } catch (error) {
            console.error('Reaction failed:', error);
        }
    };

    const handleDelete = async (updateId: string) => {
        try {
            const res = await fetch(`/api/updates/${updateId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setUpdates(prev => {
                    if (prev.some(u => u.id === updateId)) {
                        return prev.filter(u => u.id !== updateId);
                    }
                    return prev.map(u => ({
                        ...u,
                        replies: u.replies ? u.replies.filter((r: any) => r.id !== updateId) : []
                    }));
                });
            }
        } catch (error) {
            console.error('Failed to delete update:', error);
        }
    };

    const handleEdit = async (updateId: string, content: string) => {
        try {
            const res = await fetch(`/api/updates/${updateId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (res.ok) {
                const updated = await res.json();
                setUpdates(prev => {
                    if (prev.some(u => u.id === updateId)) {
                        return prev.map(u => u.id === updateId ? updated : u);
                    }
                    return prev.map(u => {
                        if (u.replies && u.replies.some((r: any) => r.id === updateId)) {
                            return {
                                ...u,
                                replies: u.replies.map((r: any) => r.id === updateId ? updated : r)
                            };
                        }
                        return u;
                    });
                });
            }
        } catch (error) {
            console.error('Failed to edit update:', error);
        }
    };

    if (!task) return null;

    return (
        <div className="fixed top-0 right-0 h-screen w-[450px] bg-[#1a1b4b] border-l border-[#2c2d65] shadow-2xl flex flex-col z-50">
            {/* Header */}
            <div className="p-5 border-b border-[#2c2d65] flex justify-between items-center bg-[#151642]">
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white truncate">{task.name}</h2>
                    <p className="text-xs text-gray-400 mt-1">{board?.name ?? 'Updates & Activity'}</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Maybe close button */}
                </div>
                <IconButton
                    icon={X as any}
                    onClick={onClose}
                    size="medium"
                    kind="tertiary"
                    ariaLabel="Close drawer"
                />
            </div>

            {/* Activity Panel */}
            <div className="flex-1 overflow-hidden relative">
                <ActivityPanel
                    updates={updates}
                    currentUser={currentUser || { id: 'temp', name: 'Loading...' }}
                    onPostUpdate={handlePostUpdate}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onReaction={handleReaction}
                    loading={loading}
                />
            </div>
        </div>
    );
}

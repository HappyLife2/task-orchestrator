/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Heart, Reply, Trash2, MoreVertical, X, ThumbsUp, Smile, Star, Zap } from 'lucide-react';
import { Avatar, Button, TextField, Menu, MenuButton, MenuItem, IconButton, Tooltip } from '@vibe/core';

interface Update {
    id: string;
    content: string;
    userId: string;
    user?: {
        name: string;
        avatarUrl?: string;
        email?: string;
    };
    createdAt: string;
    likes?: number;
    likedByCurrentUser?: boolean;
    replies?: Update[];
}

interface Task {
    id: string;
    name: string;
}

interface UpdatesDrawerProps {
    task: Task | null;
    onClose: () => void;
}

export default function UpdatesDrawer({ task, onClose }: UpdatesDrawerProps) {
    const [updates, setUpdates] = useState<Update[]>([]);
    const [newUpdate, setNewUpdate] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async () => {
        if (!newUpdate.trim() || !task) return;

        try {
            const res = await fetch(`/api/tasks/${task.id}/updates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newUpdate })
            });

            if (res.ok) {
                const update = await res.json();
                setUpdates(prev => [update, ...prev]);
                setNewUpdate('');
            }
        } catch (error) {
            console.error('Failed to post update:', error);
        }
    };

    const handleReply = async (parentId: string) => {
        if (!replyText.trim() || !task) return;

        try {
            const res = await fetch(`/api/tasks/${task.id}/updates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: replyText, parentId })
            });

            if (res.ok) {
                const reply = await res.json();
                setUpdates(prev => prev.map(u =>
                    u.id === parentId
                        ? { ...u, replies: [...(u.replies || []), reply] }
                        : u
                ));
                setReplyText('');
                setReplyingTo(null);
            }
        } catch (error) {
            console.error('Failed to post reply:', error);
        }
    };

    const handleLike = async (updateId: string) => {
        setUpdates(prev => prev.map(u =>
            u.id === updateId
                ? {
                    ...u,
                    likes: (u.likes || 0) + (u.likedByCurrentUser ? -1 : 1),
                    likedByCurrentUser: !u.likedByCurrentUser
                }
                : u
        ));
    };

    const handleDelete = async (updateId: string) => {
        if (!confirm('Delete this update?')) return;

        try {
            const res = await fetch(`/api/updates/${updateId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setUpdates(prev => prev.filter(u => u.id !== updateId));
            }
        } catch (error) {
            console.error('Failed to delete update:', error);
        }
    };

    if (!task) return null;

    return (
        <div className="fixed top-0 right-0 h-screen w-[450px] bg-[#1a1b4b] border-l border-[#2c2d65] shadow-2xl flex flex-col z-50">
            {/* Header */}
            <div className="p-5 border-b border-[#2c2d65] flex justify-between items-center bg-[#151642]">
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white truncate">{task.name}</h2>
                    <p className="text-xs text-gray-400 mt-1">Updates & Activity</p>
                </div>
                <IconButton
                    icon={X as any}
                    onClick={onClose}
                    size="medium"
                    kind="tertiary"
                    ariaLabel="Close drawer"
                />
            </div>

            {/* New Update Input */}
            <div className="p-5 border-b border-[#2c2d65]">
                <div className="bg-[#0f102a] rounded-xl p-4 border border-[#2c2d65] focus-within:border-[#e0592a] transition-all">
                    <TextField
                        value={newUpdate}
                        onChange={setNewUpdate}
                        placeholder="Write an update..."
                        size="medium"
                        wrapperClassName="w-full"
                        onKeyDown={(e: any) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                handleSubmit();
                            }
                        }}
                    />
                    <div className="flex justify-end mt-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={!newUpdate.trim()}
                            size="medium"
                        >
                            Post Update
                        </Button>
                    </div>
                </div>
            </div>

            {/* Updates Feed */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {loading ? (
                    <div className="text-center text-gray-500 py-10">Loading updates...</div>
                ) : updates.length === 0 ? (
                    <div className="text-center text-gray-500 py-16 flex flex-col items-center">
                        <div className="w-20 h-20 bg-[#0f102a] rounded-full flex items-center justify-center mb-4">
                            <Heart size={36} className="text-gray-600" />
                        </div>
                        <p className="text-sm font-medium">No updates yet</p>
                        <p className="text-xs text-gray-600 mt-1">Be the first to share an update!</p>
                    </div>
                ) : (
                    updates.map((update) => (
                        <div key={update.id} className="relative group">
                            {/* Glassmorphism Card */}
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg -z-10" />

                            {/* Update Header */}
                            <div className="p-6 flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <Avatar
                                        size="medium"
                                        type="text"
                                        text={update.user?.name || 'Unknown'}
                                        ariaLabel={update.user?.name}
                                        className="ring-2 ring-white/10 shadow-md"
                                    />
                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-base font-semibold text-white tracking-wide">{update.user?.name || 'Unknown User'}</span>
                                            <span className="text-xs text-gray-400/80 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                                {new Date(update.createdAt).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className="mt-3 text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed font-light tracking-wide">
                                            {update.content}
                                        </div>
                                    </div>
                                </div>

                                {/* More Menu */}
                                <div className="relative ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Menu>
                                        <MenuButton
                                            component={IconButton}
                                            ariaLabel="More options"
                                            {...({ icon: MoreVertical, size: "small", kind: "tertiary" } as object)}
                                        />
                                        <MenuItem
                                            icon={Trash2 as any}
                                            onClick={() => handleDelete(update.id)}
                                            title="Delete"
                                            className="text-red-400"
                                        />
                                    </Menu>
                                </div>
                            </div>

                            {/* Actions with Glassmorphism Emoji Picker */}
                            <div className="px-6 pb-4 flex items-center gap-6">
                                <div className="relative group/reactions">
                                    <button
                                        onClick={() => handleLike(update.id)}
                                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${update.likedByCurrentUser
                                            ? 'text-pink-500'
                                            : 'text-gray-400 hover:text-pink-400'
                                            }`}
                                    >
                                        <Heart
                                            size={16}
                                            fill={update.likedByCurrentUser ? 'currentColor' : 'none'}
                                        />
                                        {update.likes ? update.likes : 'Like'}
                                    </button>

                                    {/* Glassmorphism Emoji Picker Tooltip */}
                                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-lg flex items-center gap-2 opacity-0 group-hover/reactions:opacity-100 transition-all duration-300 translate-y-2 group-hover/reactions:translate-y-0 pointer-events-none group-hover/reactions:pointer-events-auto">
                                        {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLike(update.id);
                                                }}
                                                className="hover:scale-125 transition-transform text-lg px-1"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setReplyingTo(replyingTo === update.id ? null : update.id)}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    <Reply size={16} />
                                    Reply
                                </button>
                            </div>

                            {/* Reply Input */}
                            {replyingTo === update.id && (
                                <div className="px-6 pb-6 pt-2 border-t border-white/10">
                                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                        <TextField
                                            value={replyText}
                                            onChange={setReplyText}
                                            placeholder="Write a reply..."
                                            size="small"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <Button
                                                onClick={() => {
                                                    setReplyingTo(null);
                                                    setReplyText('');
                                                }}
                                                kind="tertiary"
                                                size="small"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => handleReply(update.id)}
                                                disabled={!replyText.trim()}
                                                size="small"
                                            >
                                                Reply
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Replies */}
                            {update.replies && update.replies.length > 0 && (
                                <div className="px-6 pb-6 pl-[4.5rem] space-y-4 border-t border-white/5 pt-4 bg-black/20">
                                    {update.replies.map(reply => (
                                        <div key={reply.id} className="flex gap-3 group/reply relative">
                                            <div className="absolute left-[-1.5rem] top-3 w-4 h-[1px] bg-white/10" />
                                            <Avatar
                                                size="small"
                                                type="text"
                                                text={reply.user?.name || 'Unknown'}
                                                ariaLabel={reply.user?.name}
                                                className="ring-1 ring-white/10"
                                            />
                                            <div className="flex-1 min-w-0 bg-white/5 rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-white">{reply.user?.name || 'Unknown'}</span>
                                                    <span className="text-[10px] text-gray-500">
                                                        {new Date(reply.createdAt).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: 'numeric',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-300 break-words leading-relaxed">
                                                    {reply.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

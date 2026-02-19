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

                            {/* Update Header - Flex Row for Alignment */}
                            <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
                                {/* Left: Avatar + Author Info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar
                                        size="medium"
                                        type="text"
                                        text={update.user?.name || 'Unknown'}
                                        ariaLabel={update.user?.name}
                                        className="ring-2 ring-white/10 shadow-md flex-shrink-0"
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-white truncate leading-tight">
                                            {update.user?.name || 'Unknown User'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {update.user?.email || 'Team Member'}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Timestamp + Menu Action */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {new Date(update.createdAt).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                    {/* Menu Action - Only visible on hover or if open */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Menu>
                                            <MenuButton
                                                component={IconButton}
                                                ariaLabel="More options"
                                                {...({ icon: MoreVertical, size: "small", kind: "tertiary" } as object)}
                                            />
                                            <MenuItem
                                                icon={Trash2 as any}
                                                onClick={() => handleDelete(update.id)}
                                                title="Delete Post"
                                                className="text-red-400"
                                            />
                                        </Menu>
                                    </div>
                                </div>
                            </div>

                            {/* Post Content */}
                            <div className="px-5 pb-2 ml-[3.25rem]">
                                <div className="text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed font-light">
                                    {update.content}
                                </div>
                            </div>

                            {/* Actions / Footer */}
                            <div className="px-5 pb-4 ml-[3.25rem] flex items-center gap-6">
                                {/* Like / Reaction Button */}
                                <div className="relative group/reactions">
                                    <button
                                        onClick={() => handleLike(update.id)}
                                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${update.likedByCurrentUser
                                            ? 'text-pink-500'
                                            : 'text-gray-400 hover:text-pink-400'
                                            }`}
                                        aria-label="Like post"
                                    >
                                        <Heart
                                            size={14}
                                            fill={update.likedByCurrentUser ? 'currentColor' : 'none'}
                                        />
                                        {update.likes ? update.likes : 'Like'}
                                    </button>

                                    {/* Emoji Picker - Fixed positioning and bridge */}
                                    <div className="absolute bottom-full left-0 pb-2 z-10 opacity-0 group-hover/reactions:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/reactions:pointer-events-auto">
                                        <div className="bg-[#1a1b4b]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-lg p-1.5 flex items-center gap-1">
                                            {['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🚀'].map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLike(update.id);
                                                    }}
                                                    className="hover:scale-125 hover:bg-white/10 rounded p-1 transition-all text-lg leading-none"
                                                    aria-label={`React with ${emoji}`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setReplyingTo(replyingTo === update.id ? null : update.id)}
                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                                    aria-label="Reply to post"
                                >
                                    <Reply size={14} />
                                    Reply
                                </button>
                            </div>

                            {/* Reply Input */}
                            {replyingTo === update.id && (
                                <div className="px-5 pb-5 ml-[3.25rem] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                        <TextField
                                            value={replyText}
                                            onChange={setReplyText}
                                            placeholder="Write a reply..."
                                            size="small"
                                            autoFocus
                                            wrapperClassName="w-full"
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

                            {/* Replies List */}
                            {update.replies && update.replies.length > 0 && (
                                <div className="space-y-3 pb-4 pt-1">
                                    {update.replies.map(reply => (
                                        <div key={reply.id} className="relative pl-[3.25rem] pr-5 group/reply">
                                            {/* Connector Line */}
                                            {/* <div className="absolute left-[2.2rem] top-0 bottom-0 w-[2px] bg-white/5 last:bottom-auto last:h-1/2"></div> */}

                                            <div className="flex gap-3 relative">
                                                {/* Reply Content Wrapper */}
                                                <div className="flex-1 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg p-3 transition-colors">
                                                    {/* Reply Header */}
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar
                                                                size="small"
                                                                type="text"
                                                                text={reply.user?.name || 'U'}
                                                                className="w-5 h-5 text-[9px] ring-1 ring-white/10"
                                                            />
                                                            <span className="text-xs font-semibold text-white">{reply.user?.name || 'Unknown'}</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                                            {new Date(reply.createdAt).toLocaleString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: 'numeric',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>

                                                    {/* Reply Text */}
                                                    <div className="text-xs text-gray-300 break-words leading-relaxed pl-7">
                                                        {reply.content}
                                                    </div>
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

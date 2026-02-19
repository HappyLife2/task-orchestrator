/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { MoreHorizontal, MessageSquare, Heart, Smile, Trash2, Edit2 } from 'lucide-react';
import { Avatar, IconButton, Menu, MenuButton, MenuItem } from '@vibe/core';
import ReplyItem from './ReplyItem';
import InlineReplyComposer from './InlineReplyComposer';

export interface ActivityUpdate {
    id: string;
    content: string;
    userId: string;
    user?: { name: string; avatarUrl?: string; email?: string };
    createdAt: string;
    replies?: any[];
    reactions?: any[];
    myReaction?: string | null;
}

interface ActivityItemProps {
    update: ActivityUpdate;
    currentUser: { id: string; name: string };
    onReply: (parentId: string, content: string) => Promise<void>;
    onDelete: (id: string) => void;
    onReaction: (id: string, emoji: string) => void;
}

export default function ActivityItem({ update, onReply, onDelete, onReaction }: ActivityItemProps) {
    const [isReplying, setIsReplying] = useState(false);

    const handleDelete = () => {
        if (window.confirm("Delete this post?")) {
            onDelete(update.id);
        }
    };

    return (
        <div className="group/activity animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header Row */}
            <div className="flex items-start gap-3">
                <Avatar
                    size="medium"
                    type="text"
                    text={update.user?.name || 'U'}
                    className="mt-1 shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-[#1a1b4b]"
                />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-semibold text-sm">{update.user?.name || 'Unknown'}</span>
                            <span className="text-gray-500 text-xs">•</span>
                            <span className="text-gray-500 text-xs">
                                {new Date(update.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                        </div>

                        {/* Actions Menu */}
                        <div className="opacity-0 group-hover/activity:opacity-100 transition-opacity">
                            <Menu>
                                <MenuButton
                                    component={IconButton}
                                    ariaLabel="More options"
                                    {...({
                                        icon: MoreHorizontal,
                                        size: "small",
                                        kind: "tertiary",
                                        className: "text-gray-500 hover:text-white"
                                    } as object)}
                                />
                                <MenuItem icon={Edit2 as any} onClick={() => { }} title="Edit" />
                                <MenuItem icon={Trash2 as any} onClick={handleDelete} title="Delete" className="text-red-400 hover:bg-red-500/10" />
                            </Menu>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mt-1 text-[#d1d5db] text-[15px] leading-relaxed whitespace-pre-wrap break-words font-normal">
                        {update.content}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center gap-4 mt-3">
                        <button
                            onClick={() => onReaction(update.id, '❤️')}
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${update.myReaction === '❤️' ? 'text-rose-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Heart size={14} className={update.myReaction === '❤️' ? 'fill-current' : ''} />
                            {update.reactions?.some((r: any) => r.emoji === '❤️' && r.count > 0) && (
                                <span>{update.reactions.find((r: any) => r.emoji === '❤️')?.count}</span>
                            )}
                            <span className={update.myReaction === '❤️' ? '' : 'hidden group-hover/activity:inline'}>Like</span>
                        </button>

                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            <MessageSquare size={14} />
                            {update.replies && update.replies.length > 0 && <span>{update.replies.length}</span>}
                            <span>Reply</span>
                        </button>

                        <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors opacity-0 group-hover/activity:opacity-100">
                            <Smile size={14} />
                            React
                        </button>
                    </div>

                    {/* Inline Reply Composer */}
                    {isReplying && (
                        <InlineReplyComposer
                            onSubmit={async (content) => {
                                await onReply(update.id, content);
                                setIsReplying(false);
                            }}
                            onCancel={() => setIsReplying(false)}
                        />
                    )}

                    {/* Replies List */}
                    {update.replies && update.replies.length > 0 && (
                        <div className="mt-3 space-y-3 relative">
                            {/* Vertical Thread Line */}
                            <div className="absolute left-[11px] top-[-10px] bottom-4 w-px bg-white/10 -z-10" />

                            {update.replies.map((reply: any) => (
                                <ReplyItem key={reply.id} reply={reply} onDelete={onDelete} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

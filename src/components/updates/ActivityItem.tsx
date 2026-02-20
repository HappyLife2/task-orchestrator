/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { ThumbsUp, CornerUpLeft, Bell, FileText, Trash2, Edit2 } from 'lucide-react';
import { Avatar, IconButton } from '@vibe/core';
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

export default function ActivityItem({ update, currentUser, onReply, onDelete }: ActivityItemProps) {
    const [isReplying, setIsReplying] = useState(false);

    const handleDelete = () => {
        if (window.confirm("Delete this post?")) {
            onDelete(update.id);
        }
    };

    return (
        <div className="group/activity animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* 
                THE CARD 
                - Single Border
                - Contains: Post Header, Post Content, Post Footer (Like/Reply), Divider, Replies, Reply Input
            */}
            <div className="rounded-xl border border-[#2c2d65] bg-[#1a1b4b] overflow-hidden">

                {/* --- POST SECTION --- */}
                <div className="p-5">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Avatar
                                size="medium"
                                type="text"
                                text={update.user?.name || 'U'}
                                className="bg-gradient-to-br from-gray-700 to-gray-600 ring-2 ring-[#1a1b4b]"
                            />
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-white font-bold text-[15px]">{update.user?.name || 'Unknown'}</span>
                                    <span className="text-gray-500 text-sm">
                                        {/* Reference: "21d" */}
                                        {new Date(update.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Header Actions (Top Right) */}
                        <div className="flex items-center gap-1 text-gray-400">
                            <IconButton
                                icon={FileText as any}
                                size="small"
                                kind="tertiary"
                                className="text-gray-400 hover:text-white"
                                ariaLabel="Log"
                            />
                            <IconButton
                                icon={Bell as any}
                                size="small"
                                kind="tertiary"
                                className="text-gray-400 hover:text-white"
                                ariaLabel="Subscribe"
                            />
                            {/* Direct Edit and Delete icons instead of a menu */}
                            <IconButton
                                icon={Edit2 as any}
                                size="small"
                                kind="tertiary"
                                className="text-gray-400 hover:text-white"
                                ariaLabel="Edit"
                            />
                            <IconButton
                                icon={Trash2 as any}
                                size="small"
                                kind="tertiary"
                                className="text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
                                ariaLabel="Delete"
                                onClick={handleDelete}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mt-4 text-[#d1d5db] text-[15px] leading-relaxed whitespace-pre-wrap break-words font-normal">
                        {update.content}
                    </div>

                    {/* "Edited" footer text */}
                    <div className="flex justify-end mt-2">
                        <span className="text-xs text-gray-500">Edited</span>
                    </div>

                    {/* Actions Divider */}
                    <div className="h-px bg-[#2c2d65] my-3" />

                    {/* Post Actions */}
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                            <ThumbsUp size={16} />
                            <span>Like</span>
                        </button>
                        <button
                            onClick={() => setIsReplying(true)} // Focus reply input
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <CornerUpLeft size={16} />
                            <span>Reply</span>
                        </button>
                    </div>
                </div>

                {/* --- REPLIES SECTION --- */}
                {/* Reference shows a separator line between post actions and replies/reply-input */}
                <div className="border-t border-[#2c2d65] bg-[#1a1b4b]"> {/* Maybe slightly darker? Reference looks same bg */}

                    {/* Existing Replies */}
                    {update.replies && update.replies.length > 0 && (
                        <div className="p-5 pb-0 space-y-4"> {/* Added padding */}
                            {update.replies.map((reply: any) => (
                                <ReplyItem key={reply.id} reply={reply} onDelete={onDelete} />
                            ))}
                        </div>
                    )}

                    {/* Reply Composer Area - Always visible at bottom of card */}
                    <div className="p-5">
                        <InlineReplyComposer
                            currentUser={currentUser}
                            onSubmit={async (content) => {
                                await onReply(update.id, content);
                            }}
                            autoFocus={isReplying}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

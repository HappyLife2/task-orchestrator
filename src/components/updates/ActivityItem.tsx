/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from 'react';
import { CornerUpLeft, Trash2, Edit2, Plus } from 'lucide-react';
import { Avatar } from '@vibe/core';
import ReplyItem from './ReplyItem';
import InlineReplyComposer from './InlineReplyComposer';
import EmojiPicker from './EmojiPicker';

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
    onEdit: (id: string, content: string) => void;
    onReaction: (id: string, emoji: string) => void;
}

export default function ActivityItem({ update, currentUser, onReply, onDelete, onEdit, onReaction }: ActivityItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [editContent, setEditContent] = useState(update.content);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiBtnRef = useRef<HTMLButtonElement>(null);

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsConfirmingDelete(true);
    };

    const confirmDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(update.id);
        setIsConfirmingDelete(false);
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsConfirmingDelete(false);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleSaveEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (editContent.trim() !== update.content) {
            onEdit(update.id, editContent);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditContent(update.content);
        setIsEditing(false);
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
                <div className="p-6">
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
                                    <span className="text-white font-black text-base">{update.user?.name || 'Unknown'}</span>
                                    <span className="text-gray-500 text-[11px] font-black uppercase tracking-wider">
                                        {new Date(update.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Header Actions (Top Right) */}
                        <div className="flex items-center gap-1 text-gray-400">
                            {isConfirmingDelete ? (
                                <div className="flex items-center gap-2 bg-[#2c2d65] px-3 py-1 rounded-md">
                                    <span className="text-xs text-gray-300">Delete?</span>
                                    <button type="button" onClick={confirmDelete} className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors">Yes</button>
                                    <button type="button" onClick={cancelDelete} className="text-xs text-gray-400 hover:text-white transition-colors">No</button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleEditClick}
                                        className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                                        aria-label="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="p-1.5 text-red-500/80 hover:text-red-500 rounded hover:bg-red-500/10 transition-colors"
                                        aria-label="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mt-4 text-white text-[15px] leading-relaxed whitespace-pre-wrap break-words font-normal">
                        {isEditing ? (
                            <div className="flex flex-col gap-2">
                                <textarea
                                    className="w-full bg-[#24265a] border border-[#2c2d65] rounded-md p-3 text-white focus:outline-none focus:border-blue-500 resize-none min-h-[80px]"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={handleCancelEdit} className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                                    <button onClick={handleSaveEdit} className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">Save</button>
                                </div>
                            </div>
                        ) : (
                            update.content
                        )}
                    </div>

                    {/* "Edited" footer text */}
                    <div className="flex justify-end mt-2">
                        <span className="text-xs text-gray-500">Edited</span>
                    </div>

                    {/* Actions Divider */}
                    <div className="h-px bg-[#2c2d65] my-3" />

                    {/* Post Actions */}
                    <div className="flex items-center flex-wrap gap-2">
                        {/* Render existing reactions as pills */}
                        {update.reactions?.map(r => (
                            <button
                                key={r.emoji}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onReaction(update.id, r.emoji);
                                }}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm transition-all border ${r.reactedByMe
                                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                                    : 'bg-[#2c2d65]/30 border-[#2c2d65] text-gray-400 hover:text-white hover:bg-[#2c2d65]'
                                    }`}
                            >
                                <span>{r.emoji}</span>
                                <span className={`text-[11px] font-bold ${r.reactedByMe ? 'text-blue-300' : 'text-gray-500'}`}>{r.count}</span>
                            </button>
                        ))}

                        <div className="relative">
                            <button
                                ref={emojiBtnRef}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowEmojiPicker(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                                aria-label="Add reaction"
                            >
                                <Plus size={16} />
                            </button>
                            {showEmojiPicker && (
                                <EmojiPicker
                                    triggerRef={emojiBtnRef}
                                    onSelect={(emoji) => onReaction(update.id, emoji)}
                                    onClose={() => setShowEmojiPicker(false)}
                                />
                            )}
                        </div>

                        <div className="flex-1 min-w-[12px]" />

                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsReplying(true);
                            }}
                            className="flex items-center gap-2 text-[13px] font-medium text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded hover:bg-white/5"
                        >
                            <CornerUpLeft size={14} />
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
                                <ReplyItem key={reply.id} reply={reply} onDelete={onDelete} onEdit={onEdit} />
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

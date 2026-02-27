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
    user?: { id: string; name: string; avatarUrl?: string; email?: string };
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
            <div className="rounded-2xl border border-white/10 bg-[#121331]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.5)] hover:border-white/20">

                {/* --- POST SECTION --- */}
                <div className="p-4">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {/* Premium Avatar */}
                            <div className="relative group/avatar">
                                <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-75 group-hover/avatar:opacity-100 blur-[2px] transition duration-500"></div>
                                <div className="relative w-10 h-10 rounded-full border-2 border-[#121331] bg-[#1a1b4b] flex items-center justify-center overflow-hidden">
                                    {update.user?.avatarUrl ? (
                                        <img src={update.user.avatarUrl} alt={update.user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-base font-black text-white bg-gradient-to-br from-indigo-400 to-purple-600 w-full h-full flex items-center justify-center">
                                            {update.user?.name?.charAt(0) || 'U'}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#121331] rounded-full shadow-lg"></div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-base tracking-tight hover:text-indigo-300 transition-colors cursor-pointer">{update.user?.name || 'Unknown'}</span>
                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2 mt-0.5">
                                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                    {new Date(update.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(update.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        {/* Header Actions (Top Right) - Only if owner or ADMIN */}
                        <div className="flex items-center gap-2">
                            {(currentUser.id === update.userId || currentUser.id === update.user?.id || (currentUser as any).role === 'ADMIN') && (
                                isConfirmingDelete ? (
                                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl animate-in fade-in zoom-in duration-200">
                                        <span className="text-[11px] text-red-200 font-bold uppercase tracking-wider">Confirm?</span>
                                        <button type="button" onClick={confirmDelete} className="text-[11px] bg-red-500 text-white px-2 py-0.5 rounded-md hover:bg-red-600 font-bold transition-all">DELETE</button>
                                        <button type="button" onClick={cancelDelete} className="text-[11px] text-gray-400 hover:text-white transition-colors">CANCEL</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 opacity-0 group-hover/activity:opacity-100 transition-all duration-300 translate-y-1 group-hover/activity:translate-y-0">
                                        <button
                                            type="button"
                                            onClick={handleEditClick}
                                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-xl hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-500/20"
                                            aria-label="Edit"
                                            title="Edit post"
                                        >
                                            <Edit2 size={16} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="p-2 text-gray-400 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                                            aria-label="Delete"
                                            title="Delete post"
                                        >
                                            <Trash2 size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mt-3 text-white text-[15px] leading-relaxed whitespace-pre-wrap break-words font-normal">
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
                            <div dangerouslySetInnerHTML={{ __html: update.content }} />
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
                                className="p-1.5 text-gray-400 hover:text-indigo-400 rounded-full hover:bg-indigo-500/10 transition-colors flex items-center justify-center"
                                aria-label="Add reaction"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smile"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>
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
                                <ReplyItem
                                    key={reply.id}
                                    reply={reply}
                                    currentUser={currentUser}
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                    onReaction={onReaction}
                                    onReplyClick={() => setIsReplying(true)}
                                />
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

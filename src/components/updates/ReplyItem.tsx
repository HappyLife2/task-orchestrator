/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Avatar } from '@vibe/core';
import { ThumbsUp, CornerUpLeft, Trash2, Edit2, Smile } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { useRef } from 'react';

interface Reply {
    id: string;
    content: string;
    createdAt: string;
    user?: { name: string; avatarUrl?: string };
}

interface ReplyItemProps {
    reply: any;
    currentUser: { id: string; name: string; avatarUrl?: string };
    onDelete: (id: string) => void;
    onEdit: (id: string, content: string) => void;
    onReaction: (id: string, emoji: string) => void;
    onReplyClick: () => void;
}

export default function ReplyItem({ reply, currentUser, onDelete, onEdit, onReaction, onReplyClick }: ReplyItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [editContent, setEditContent] = useState(reply.content);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiBtnRef = useRef<HTMLButtonElement>(null);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsConfirmingDelete(true);
    };

    const confirmDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(reply.id);
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
        if (editContent.trim() !== reply.content) {
            onEdit(reply.id, editContent);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditContent(reply.content);
        setIsEditing(false);
    };

    return (
        <div className="flex gap-3 group/reply">
            <div className="shrink-0">
                <div className="relative group/avatar">
                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-60 group-hover/avatar:opacity-100 blur-[1px] transition duration-500"></div>
                    <div className="relative w-10 h-10 rounded-full border-2 border-[#1a1b4b] bg-[#1a1b4b] flex items-center justify-center overflow-hidden">
                        {reply.user?.avatarUrl ? (
                            <img src={reply.user.avatarUrl} alt={reply.user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-black text-white bg-gradient-to-br from-indigo-400 to-purple-600 w-full h-full flex items-center justify-center">
                                {reply.user?.name?.charAt(0) || 'U'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-w-0">
                {/* Content Box */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-[13px] tracking-tight">{reply.user?.name || 'Unknown'}</span>
                            <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2 mt-0.5">
                                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                {new Date(reply.createdAt).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                        </div>

                        {/* Top-right icons: Only if owner or ADMIN */}
                        <div className="opacity-0 group-hover/reply:opacity-100 flex items-center gap-2 transition-opacity place-self-start">
                            {(currentUser.id === reply.userId || currentUser.id === reply.user?.id || (currentUser as any).role === 'ADMIN') && (
                                isConfirmingDelete ? (
                                    <div className="flex items-center gap-2 bg-[#1a1b4b] border border-[#2c2d65] px-2 py-0.5 rounded shadow-sm">
                                        <span className="text-[10px] text-gray-300 font-medium">Delete?</span>
                                        <button type="button" onClick={confirmDelete} className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors">Yes</button>
                                        <button type="button" onClick={cancelDelete} className="text-[10px] text-gray-400 hover:text-white transition-colors">No</button>
                                    </div>
                                ) : (
                                    <>
                                        <button type="button" onClick={handleEditClick} className="text-gray-500 hover:text-white p-1 rounded hover:bg-white/5 transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button type="button" onClick={handleDeleteClick} className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )
                            )}
                        </div>
                    </div>

                    <div className="text-gray-300 text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                        {isEditing ? (
                            <div className="flex flex-col gap-2 mt-2">
                                <textarea
                                    className="w-full bg-[#1a1b4b] border border-[#2c2d65] rounded-md p-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none min-h-[60px]"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={handleCancelEdit} className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors">Cancel</button>
                                    <button onClick={handleSaveEdit} className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: reply.content }} />
                        )}
                    </div>
                </div>

                {/* Actions Below Box: Reactions, Like, Reply */}
                <div className="flex items-center gap-3 mt-1.5 ml-1">
                    {/* Render existing reactions as pills */}
                    {reply.reactions?.map((r: any) => (
                        <button
                            key={r.emoji}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onReaction(reply.id, r.emoji);
                            }}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] transition-all border ${r.reactedByMe
                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                                : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <span>{r.emoji}</span>
                            <span className={`font-bold ${r.reactedByMe ? 'text-blue-300' : 'text-gray-600'}`}>{r.count}</span>
                        </button>
                    ))}

                    <div className="relative">
                        <button
                            ref={emojiBtnRef}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEmojiPicker(true); }}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-indigo-400 transition-colors"
                        >
                            <Smile size={12} />
                            <span>React</span>
                        </button>
                        {showEmojiPicker && (
                            <EmojiPicker
                                triggerRef={emojiBtnRef}
                                onSelect={(emoji) => onReaction(reply.id, emoji)}
                                onClose={() => setShowEmojiPicker(false)}
                            />
                        )}
                    </div>

                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReplyClick(); }}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-white transition-colors"
                    >
                        <CornerUpLeft size={12} />
                        <span>Reply</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

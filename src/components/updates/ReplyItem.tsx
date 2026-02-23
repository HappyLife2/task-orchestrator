/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Avatar } from '@vibe/core';
import { ThumbsUp, CornerUpLeft, Trash2, Edit2 } from 'lucide-react';

interface Reply {
    id: string;
    content: string;
    createdAt: string;
    user?: { name: string; avatarUrl?: string };
}

interface ReplyItemProps {
    reply: Reply;
    onDelete: (id: string) => void;
    onEdit: (id: string, content: string) => void;
}

export default function ReplyItem({ reply, onDelete, onEdit }: ReplyItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [editContent, setEditContent] = useState(reply.content);

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
                <Avatar
                    size="medium" // Size per reference (looks similar to main user)
                    type="text"
                    text={reply.user?.name || 'U'}
                    className="bg-gray-700 ring-2 ring-[#1a1b4b]"
                />
            </div>

            <div className="flex-1 min-w-0">
                {/* Content Box */}
                <div className="bg-[#24265a] rounded-xl p-3 border border-[#2c2d65]/50">
                    <div className="flex items-baseline justify-between mb-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-white font-black text-sm">{reply.user?.name || 'Unknown'}</span>
                            <span className="text-gray-500 text-[10px] font-black uppercase tracking-wider">
                                {new Date(reply.createdAt).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                        </div>

                        {/* Top-right icons: Edit and Delete raw icons only */}
                        <div className="opacity-0 group-hover/reply:opacity-100 flex items-center gap-2 transition-opacity place-self-start">
                            {isConfirmingDelete ? (
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

                {/* Actions Below Box: Like, Reply */}
                <div className="flex items-center gap-4 mt-1.5 ml-1">
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <ThumbsUp size={12} />
                        <span>Like</span>
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <CornerUpLeft size={12} />
                        <span>Reply</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar } from '@vibe/core';
import { ThumbsUp, CornerUpLeft, Trash2 } from 'lucide-react';

interface Reply {
    id: string;
    content: string;
    createdAt: string;
    user?: { name: string; avatarUrl?: string };
}

interface ReplyItemProps {
    reply: Reply;
    onDelete: (id: string) => void;
}

export default function ReplyItem({ reply, onDelete }: ReplyItemProps) {
    const handleDeleteClick = () => {
        if (window.confirm("Delete this reply?")) {
            onDelete(reply.id);
        }
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
                            <span className="text-white font-bold text-sm">{reply.user?.name || 'Unknown'}</span>
                            <span className="text-gray-400 text-xs">
                                {/* Reference says "Just now" */}
                                {new Date(reply.createdAt).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                        </div>

                        {/* Optional delete for owner */}
                        <button onClick={handleDeleteClick} className="opacity-0 group-hover/reply:opacity-100 text-gray-500 hover:text-red-400 transition-opacity">
                            <Trash2 size={12} />
                        </button>
                    </div>

                    <div className="text-gray-300 text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                        {reply.content}
                    </div>
                </div>

                {/* Actions Below Box: Like, Reply */}
                <div className="flex items-center gap-4 mt-1.5 ml-1">
                    <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors">
                        <ThumbsUp size={12} />
                        <span>Like</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors">
                        <CornerUpLeft size={12} />
                        <span>Reply</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

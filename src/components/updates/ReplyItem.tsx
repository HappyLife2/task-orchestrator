/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar, IconButton } from '@vibe/core';
import { Trash2 } from 'lucide-react';

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
        <div className="relative flex gap-3 group/reply pl-6">
            {/* Guide Line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-px bg-white/10 -z-10" />
            {/* Curve */}
            <div className="absolute left-[11px] top-4 w-4 h-px bg-white/10" />

            <div className="shrink-0 mt-1 relative z-10">
                <Avatar
                    size="small"
                    type="text"
                    text={reply.user?.name || 'U'}
                    className="ring-2 ring-[#1a1b4b]" // Ring to mask guide line behind avatar
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{reply.user?.name || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">
                        {new Date(reply.createdAt).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}
                    </span>
                </div>

                <div className="text-gray-300 text-sm mt-0.5 leading-relaxed whitespace-pre-wrap break-words">
                    {reply.content}
                </div>
            </div>

            <div className="opacity-0 group-hover/reply:opacity-100 transition-opacity">
                <IconButton
                    icon={Trash2 as any}
                    size="small"
                    kind="tertiary"
                    className="text-gray-500 hover:text-red-400"
                    ariaLabel="Delete reply"
                    onClick={handleDeleteClick}
                />
            </div>
        </div>
    );
}

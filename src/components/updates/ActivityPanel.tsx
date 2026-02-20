import { useRef } from 'react';
import UpdateComposer from './UpdateComposer';
import ActivityItem, { ActivityUpdate } from './ActivityItem';
import { Heart } from 'lucide-react';

interface ActivityPanelProps {
    updates: ActivityUpdate[];
    currentUser: { id: string; name: string; avatarUrl?: string };
    onPostUpdate: (content: string) => Promise<void>;
    onReply: (parentId: string, content: string) => Promise<void>;
    onDelete: (id: string) => void;
    onEdit: (id: string, content: string) => void;
    onReaction: (id: string, emoji: string) => void;
    loading?: boolean;
}

export default function ActivityPanel({
    updates,
    currentUser,
    onPostUpdate,
    onReply,
    onDelete,
    onEdit,
    onReaction,
    loading = false
}: ActivityPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new updates if already near bottom? 
    // Or just keep scroll position. For now, standard behavior.

    return (
        <div className="flex flex-col h-full bg-[#1a1b4b]">
            {/* Composer Area - Fixed at top or scrollable? 
               Usually composer is at top in Linear/Monday for new items, 
               or bottom for chat. 
               User request: "Update Composer (top)"
            */}
            <div className="p-5 shrink-0 z-10 bg-[#1a1b4b] sticky top-0">
                <UpdateComposer
                    currentUser={currentUser}
                    onSubmit={onPostUpdate}
                />
            </div>

            {/* Feed Area */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8" ref={scrollRef}>
                {loading && updates.length === 0 ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                ) : updates.length === 0 ? (
                    <div className="text-center text-gray-500 py-16 flex flex-col items-center select-none opacity-60">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-white/10">
                            <Heart size={28} className="text-gray-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">No updates yet</p>
                        <p className="text-xs text-gray-600 mt-1">Kickstart the conversation!</p>
                    </div>
                ) : (
                    updates.map(update => (
                        <ActivityItem
                            key={update.id}
                            update={update}
                            currentUser={currentUser}
                            onReply={onReply}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onReaction={onReaction}
                        />
                    ))
                )}

                {/* Bottom padding for comfort */}
                <div className="h-10" />
            </div>
        </div>
    );
}

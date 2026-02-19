/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { IconButton } from '@vibe/core';
import { Smile, Image as ImageIcon } from 'lucide-react';

interface InlineReplyComposerProps {
    onSubmit: (content: string) => Promise<void>;
    onCancel: () => void;
}

export default function InlineReplyComposer({ onSubmit, onCancel }: InlineReplyComposerProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Submits on Enter for quick replies
            e.preventDefault();
            await handleSubmit();
        }
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSubmit(content);
            setContent('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex gap-3 items-start mt-2 ml-11"> {/* Indented to align with thread */}
            <div className="flex-1 bg-[#1a1b4b] border border-[#2c2d65] focus-within:border-blue-500/50 rounded-lg p-2 transition-colors">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a reply..."
                    rows={1}
                    disabled={isSubmitting}
                    className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm min-h-[20px] max-h-[150px]"
                />
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <div className="flex gap-1">
                        <IconButton icon={Smile as any} size="small" kind="tertiary" className="text-gray-500 hover:text-white" ariaLabel="Emoji" />
                        <IconButton icon={ImageIcon as any} size="small" kind="tertiary" className="text-gray-500 hover:text-white" ariaLabel="Image" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="text-xs text-gray-500 hover:text-white transition-colors" disabled={isSubmitting}>Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim() || isSubmitting}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-md transition-colors disabled:opacity-50"
                        >
                            Reply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

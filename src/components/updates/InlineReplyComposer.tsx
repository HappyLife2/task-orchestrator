/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { Avatar } from '@vibe/core';

interface InlineReplyComposerProps {
    currentUser: { name: string; id: string };
    onSubmit: (content: string) => Promise<void>;
    autoFocus?: boolean;
}

export default function InlineReplyComposer({ currentUser, onSubmit, autoFocus = false }: InlineReplyComposerProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSubmit(content);
            setContent('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'; // Reset height
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex gap-3 items-start">
            <div className="shrink-0">
                <Avatar
                    size="medium"
                    type="text"
                    text={currentUser.name || 'Me'}
                    className="bg-gray-700 ring-2 ring-[#1a1b4b]"
                />
            </div>

            <div className="flex-1">
                <div className="bg-[#1a1b4b] border border-[#2c2d65] focus-within:border-blue-500/50 rounded-xl px-4 py-3 transition-colors">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a reply and mention others with @"
                        rows={1}
                        disabled={isSubmitting}
                        className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none text-[14px] leading-relaxed min-h-[20px] max-h-[150px]"
                    />
                </div>
            </div>
        </div>
    );
}

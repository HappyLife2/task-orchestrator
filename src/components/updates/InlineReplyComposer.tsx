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
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
            setIsFocused(true);
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
            setIsFocused(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex gap-3 items-start w-full">
            <div className="shrink-0 mt-0.5">
                <div className="relative group/avatar">
                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-60 group-hover/avatar:opacity-100 blur-[1px] transition duration-500"></div>
                    <div className="relative w-10 h-10 rounded-full border-2 border-[#1a1b4b] bg-[#1a1b4b] flex items-center justify-center overflow-hidden">
                        <span className="text-sm font-black text-white bg-gradient-to-br from-indigo-400 to-purple-600 w-full h-full flex items-center justify-center">
                            {currentUser.name?.charAt(0) || 'M'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <div className={`bg-white/5 backdrop-blur-md border rounded-2xl px-4 py-3 transition-all duration-300 shadow-inner ${isFocused ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-white/10'}`}>
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => !content.trim() && setIsFocused(false)}
                        placeholder="Write a reply and mention others with @"
                        rows={1}
                        disabled={isSubmitting}
                        className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none text-[14px] leading-relaxed min-h-[24px] max-h-[150px]"
                    />

                    {(isFocused || content.trim()) && (
                        <div className="flex justify-end items-center gap-2 mt-3 pt-3 border-t border-[#2c2d65]/50 animate-in fade-in slide-in-from-top-1 duration-200">
                            <button
                                type="button"
                                onClick={() => {
                                    setContent('');
                                    if (textareaRef.current) {
                                        textareaRef.current.style.height = 'auto';
                                    }
                                    setIsFocused(false);
                                }}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!content.trim() || isSubmitting}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${content.trim() && !isSubmitting
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                    : 'bg-[#2c2d65] text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {isSubmitting ? 'Posting...' : 'Reply'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

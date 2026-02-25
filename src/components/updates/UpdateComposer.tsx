/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { AtSign, Paperclip, Smile, Sparkles } from 'lucide-react';
import { IconButton } from '@vibe/core';

interface UpdateComposerProps {
    currentUser: { name: string; avatarUrl?: string };
    onSubmit: (content: string) => Promise<void>;
    placeholder?: string;
    autoFocus?: boolean;
    onCancel?: () => void;
}

export default function UpdateComposer({ currentUser, onSubmit, placeholder = "Write an update and mention others with @", autoFocus = false, onCancel }: UpdateComposerProps) {
    const [content, setContent] = useState('');
    const [isFocused, setIsFocused] = useState(false);
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
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (content.trim()) {
                await handleSubmit();
            }
        }
    };

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSubmit(content);
            setContent('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
            setIsFocused(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`
             relative rounded-2xl border bg-white/5 backdrop-blur-md p-4 transition-all duration-300 shadow-inner w-full
             ${isFocused ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-white/10'}
        `}>
            <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => !content && setIsFocused(false)}
                placeholder={placeholder}
                rows={1}
                disabled={isSubmitting}
                className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none text-[15px] leading-relaxed min-h-[24px] max-h-[300px]"
            />

            <div className="flex items-center gap-1 mt-3">
                <IconButton icon={AtSign as any} size="small" kind="tertiary" className="text-gray-400 hover:text-white" ariaLabel="Mention" />
                <IconButton icon={Paperclip as any} size="small" kind="tertiary" className="text-gray-400 hover:text-white" ariaLabel="Attach" />
                <button className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition-colors text-[10px] font-bold text-gray-400 hover:text-white">
                    GIF
                </button>
                <IconButton icon={Smile as any} size="small" kind="tertiary" className="text-gray-400 hover:text-white" ariaLabel="Emoji" />
                <IconButton icon={Sparkles as any} size="small" kind="tertiary" className="text-blue-500 hover:text-blue-400" ariaLabel="Format" />

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                    {onCancel && (
                        <button
                            onClick={() => {
                                onCancel();
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
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || isSubmitting}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${content.trim() && !isSubmitting
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
                            : 'bg-white/10 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {isSubmitting ? 'Posting...' : 'Update'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List, AtSign, Paperclip, Smile, Image as ImageIcon } from 'lucide-react';
import { Avatar, IconButton, Button } from '@vibe/core';

interface UpdateComposerProps {
    currentUser: { name: string; avatarUrl?: string };
    onSubmit: (content: string) => Promise<void>;
    placeholder?: string;
    autoFocus?: boolean;
    onCancel?: () => void; // Optional cancel for inline replies
}

export default function UpdateComposer({ currentUser, onSubmit, placeholder = "Write an update...", autoFocus = false, onCancel }: UpdateComposerProps) {
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
        // Auto-resize
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
                textareaRef.current.style.height = 'auto'; // Reset height
            }
            if (onCancel) onCancel(); // Close if it's inline reply
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`
             relative rounded-xl border transition-all duration-200 bg-[#0f102a]
             ${isFocused ? 'border-blue-500/50 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : 'border-[#2c2d65]'}
        `}>
            <div className="flex items-start gap-3 p-4">
                <Avatar
                    size="medium"
                    type="text"
                    text={currentUser.name}
                    className="mt-0.5 shrink-0"
                />

                <div className="flex-1 min-w-0">
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
                        className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm leading-relaxed min-h-[24px] max-h-[300px]"
                    />
                </div>
            </div>

            {/* Toolbar - Only visible when focused or has content (top composer), or always visible for inline reply? 
                Let's make it always visible but subtle, or fade in. 
                User request: "Toolbar row: @ mention | attachment... below it"
            */}
            {(isFocused || content) && (
                <div className="flex items-center justify-between px-3 pb-3 pt-2">
                    <div className="flex items-center gap-1">
                        <IconButton icon={AtSign as any} size="small" kind="tertiary" className="text-gray-400 hover:text-white" ariaLabel="Mention" />
                        <IconButton icon={Paperclip as any} size="small" kind="tertiary" className="text-gray-400 hover:text-white" ariaLabel="Attach file" />
                        <IconButton icon={ImageIcon as any} size="small" kind="tertiary" className="text-gray-400 hover:text-white" ariaLabel="Add image" />
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <IconButton icon={Bold as any} size="small" kind="tertiary" className="text-gray-400 hover:text-white" ariaLabel="Bold" />
                        <IconButton icon={Italic as any} size="small" kind="tertiary" className="text-gray-400 hover:text-white" ariaLabel="Italic" />
                        <IconButton icon={List as any} size="small" kind="tertiary" className="text-gray-400 hover:text-white" ariaLabel="List" />
                        <IconButton icon={Smile as any} size="small" kind="tertiary" className="text-gray-400 hover:text-white" ariaLabel="Emoji" />
                    </div>

                    <div className="flex items-center gap-2">
                        {onCancel && (
                            <Button size="small" kind="tertiary" onClick={onCancel} disabled={isSubmitting}>
                                Cancel
                            </Button>
                        )}
                        <Button
                            size="small"
                            onClick={handleSubmit}
                            disabled={!content.trim() || isSubmitting}
                            className="px-4"
                        >
                            {isSubmitting ? 'Posting...' : 'Post'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

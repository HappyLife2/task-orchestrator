'use client';

import { PortalMenu } from '../PortalMenu';

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement>;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🎉', '✅', '🚀', '😢', '😮', '🙏', '💯'];

export default function EmojiPicker({ onSelect, onClose, triggerRef }: EmojiPickerProps) {
    return (
        <PortalMenu triggerRef={triggerRef} onClose={onClose} width={240}>
            <div className="bg-[#1a1b4b] border border-[#2c2d65] rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-100">
                <div className="grid grid-cols-5 gap-1">
                    {COMMON_EMOJIS.map(emoji => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                                onSelect(emoji);
                                onClose();
                            }}
                            className="w-10 h-10 flex items-center justify-center text-xl hover:bg-[#2c2d65] rounded-lg transition-colors"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </PortalMenu>
    );
}

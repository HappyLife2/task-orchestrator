'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationToastProps {
    id: string;
    title: string;
    content: string;
    link?: string;
    senderName?: string;
    onClose: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
    id,
    title,
    content,
    link,
    senderName,
    onClose
}) => {
    const router = useRouter();

    const handleView = () => {
        if (link) {
            router.push(link);
        }
        onClose(id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="w-96 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 flex gap-4 items-start pointer-events-auto"
        >
            <div className="w-10 h-10 rounded-full bg-accent-indigo/20 flex items-center justify-center text-accent-indigo shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {senderName?.charAt(0).toUpperCase() || <Bell size={16} />}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white uppercase tracking-wider mb-0.5">{title}</p>
                <p className="text-[13px] text-gray-200 leading-snug line-clamp-2">{content}</p>
                <p className="text-[10px] text-gray-500 mt-2 font-medium">Just now</p>
            </div>

            <div className="flex flex-col gap-2">
                <button
                    onClick={() => onClose(id)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
                {link && (
                    <button
                        onClick={handleView}
                        className="p-1.5 hover:bg-accent-indigo/20 rounded-lg text-accent-indigo hover:text-white transition-colors"
                    >
                        <Eye size={16} />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

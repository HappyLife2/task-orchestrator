'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { NotificationToast } from './NotificationToast';

interface Toast {
    id: string;
    title: string;
    content: string;
    link?: string;
    senderName?: string;
}

export const NotificationListener: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        let eventSource: EventSource | null = null;

        const connect = () => {
            eventSource = new EventSource('/api/notifications/stream');

            eventSource.onmessage = (event) => {
                try {
                    const notification = JSON.parse(event.data);
                    const newToast: Toast = {
                        id: notification.id || Math.random().toString(36).substr(2, 9),
                        title: notification.title,
                        content: notification.content || '',
                        link: notification.link || undefined,
                        senderName: (notification as any).senderName
                    };

                    setToasts(prev => [...prev, newToast]);

                    if (typeof window !== 'undefined') {
                        const event = new CustomEvent('new-notification', { detail: newToast });
                        window.dispatchEvent(event);
                    }

                    // Auto-dismiss after 40 seconds
                    setTimeout(() => {
                        removeToast(newToast.id);
                    }, 40000);
                } catch (err) {
                    console.error('Failed to parse notification:', err);
                }
            };

            eventSource.onerror = () => {
                eventSource?.close();
                // Attempt to reconnect after 5 seconds
                setTimeout(connect, 5000);
            };
        };

        connect();

        return () => {
            eventSource?.close();
        };
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map(toast => (
                    <NotificationToast
                        key={toast.id}
                        {...toast}
                        onClose={removeToast}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

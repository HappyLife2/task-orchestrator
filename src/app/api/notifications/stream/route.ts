import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { notificationEmitter } from '@/lib/notifications-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return new Response('Unauthorized', { status: 401 });
    }

    const userId = payload.userId;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            const onNotification = (notification: any) => {
                console.log(`SSE: Sending notification to user ${userId}:`, notification.title);
                const data = JSON.stringify(notification);
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            };

            // Subscribe to this specific user's notifications
            console.log(`SSE: User ${userId} connected to stream`);
            notificationEmitter.on(`notification:${userId}`, onNotification);

            // Send initial connection message
            controller.enqueue(encoder.encode(': connected\n\n'));

            // Keep-alive ping every 30 seconds
            const keepAlive = setInterval(() => {
                controller.enqueue(encoder.encode(': ping\n\n'));
            }, 30000);

            req.signal.addEventListener('abort', () => {
                clearInterval(keepAlive);
                notificationEmitter.off(`notification:${userId}`, onNotification);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

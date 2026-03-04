import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Ensure the notification belongs to the user
        const notification = await db.notification.findUnique({
            where: { id: params.id }
        });

        if (!notification || notification.userId !== payload.userId) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        const updatedNotification = await db.notification.update({
            where: { id: params.id },
            data: { isRead: true }
        });

        return NextResponse.json(updatedNotification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

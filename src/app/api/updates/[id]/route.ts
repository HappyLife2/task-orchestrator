import { NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const token = (request as any).cookies?.get('token')?.value || request.headers.get('cookie')?.split('; ').find(c => c.startsWith('token='))?.split('=')[1];
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: 'Update ID is required' }, { status: 400 });
        }

        // Ownership check
        const update = await db.update.findUnique({ where: { id } });
        if (!update) {
            return NextResponse.json({ error: 'Update not found' }, { status: 404 });
        }

        if (update.userId !== payload.userId && payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await db.update.delete({
            where: { id: id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete update:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const token = (request as any).cookies?.get('token')?.value || request.headers.get('cookie')?.split('; ').find(c => c.startsWith('token='))?.split('=')[1];
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = params;
        const body = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Update ID is required' }, { status: 400 });
        }

        if (!body.content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Ownership check
        const update = await db.update.findUnique({ where: { id } });
        if (!update) {
            return NextResponse.json({ error: 'Update not found' }, { status: 404 });
        }

        if (update.userId !== payload.userId && payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updatedUpdate = await db.update.update({
            where: { id: id },
            data: { content: body.content },
            include: { user: true, replies: { include: { user: true } }, reactions: true }
        });

        return NextResponse.json(updatedUpdate);
    } catch (error) {
        console.error('Failed to update update:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createUpdateSchema = z.object({
    content: z.string().min(1),
    parentId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;

    try {
        const updates = await db.update.findMany({
            where: { taskId },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                replies: {
                    include: {
                        user: { select: { id: true, name: true, email: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Filter out replies from top level if we want threaded view, 
        // but typically we just fetch all and reconstruct or fetch top-level only.
        // Let's fetch all and filter in UI or query logic.
        // Actually, let's just return top-level updates and their replies.
        const topLevelUpdates = updates.filter((u: any) => !u.parentId);

        return NextResponse.json(topLevelUpdates);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
    }
}


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { content, parentId } = createUpdateSchema.parse(body);
        const taskId = params.id;

        const update = await db.update.create({
            data: {
                content,
                taskId,
                userId: payload.userId,
                parentId
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(update, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create update' }, { status: 500 });
    }
}

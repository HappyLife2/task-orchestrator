import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createTaskSchema = z.object({
    name: z.string().min(1),
    boardId: z.string().uuid(),
    description: z.string().optional(),
    columnValues: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, boardId, description, columnValues } = createTaskSchema.parse(body);

        const board = await db.board.findUnique({
            where: { id: boardId },
            include: { department: true }
        });

        if (!board || board.department.organizationId !== payload.orgId) {
            return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        }

        const task = await db.task.create({
            data: {
                name,
                boardId,
                description,
                columnValues: JSON.stringify(columnValues || {}),
                assignedUsers: { connect: [{ id: payload.userId }] },
                creatorId: payload.userId
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

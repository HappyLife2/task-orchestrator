import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createSubTaskSchema = z.object({
    name: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name } = createSubTaskSchema.parse(body);
        const parentTaskId = params.id;

        // Verify parent task exists and belongs to org
        const parentTask = await db.task.findUnique({
            where: { id: parentTaskId },
            include: { board: { include: { department: true } } }
        });

        if (!parentTask || parentTask.board.department.organizationId !== payload.orgId) {
            return NextResponse.json({ error: 'Parent task not found or access denied' }, { status: 404 });
        }

        const subTask = await db.task.create({
            data: {
                name,
                boardId: parentTask.boardId,
                parentTaskId: parentTask.id,
                creatorId: payload.userId,
                // Inherit some properties if needed, or default
            },
        });

        return NextResponse.json(subTask, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

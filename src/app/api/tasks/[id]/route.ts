import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const updateTaskSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    state: z.string().optional(), // ACTIVE, ARCHIVED
    columnValues: z.record(z.string(), z.any()).optional(),
    assignedUserId: z.string().optional().nullable(),
    referenceId: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, description, state, columnValues, assignedUserId, referenceId } = updateTaskSchema.parse(body);
        const taskId = params.id;

        // Verify task exists and belongs to org
        const task = await db.task.findUnique({
            where: { id: taskId },
            include: { board: { include: { department: true } } }
        });

        if (!task || task.board.department.organizationId !== payload.orgId) {
            return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (state !== undefined) updateData.state = state;
        if (assignedUserId !== undefined) updateData.assignedUserId = assignedUserId;
        if (referenceId !== undefined) updateData.referenceId = referenceId;

        // Merge column values if provided
        if (columnValues) {
            const currentValues = JSON.parse(task.columnValues || '{}');
            updateData.columnValues = JSON.stringify({ ...currentValues, ...columnValues });
        }

        const updatedTask = await db.task.update({
            where: { id: taskId },
            data: updateData,
            include: { // Return relations for immediate UI update
                assignedUser: true,
                subTasks: true
            }
        });

        return NextResponse.json(updatedTask);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

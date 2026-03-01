/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const updateTaskSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    state: z.string().optional(), // ACTIVE, ARCHIVED
    columnValues: z.record(z.string(), z.any()).optional(),
    assignedUserIds: z.array(z.string()).optional(),
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
        const { name, description, state, columnValues, assignedUserIds, referenceId } = updateTaskSchema.parse(body);
        const taskId = params.id;

        // Verify task exists and belongs to org
        const task = await db.task.findUnique({
            where: { id: taskId },
            include: {
                board: { include: { department: true } },
                assignedUsers: true
            }
        });

        if (!task || task.board.department.organizationId !== payload.orgId) {
            return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (state !== undefined) updateData.state = state;
        if (referenceId !== undefined) updateData.referenceId = referenceId;

        if (assignedUserIds !== undefined) {
            updateData.assignedUsers = {
                set: assignedUserIds.map(id => ({ id }))
            };
        }

        // Merge column values if provided
        if (columnValues) {
            const currentValues = JSON.parse(task.columnValues || '{}');
            updateData.columnValues = JSON.stringify({ ...currentValues, ...columnValues });
        }

        const updatedTask = await db.task.update({
            where: { id: taskId },
            data: updateData,
            include: {
                assignedUsers: true,
                subTasks: true
            }
        });

        // Trigger notifications for NEWLY assigned users
        if (assignedUserIds) {
            const previousUserIds = new Set(task.assignedUsers.map((u: any) => u.id));
            const newlyAddedIds = assignedUserIds.filter(id => !previousUserIds.has(id) && id !== payload.userId);

            if (newlyAddedIds.length > 0) {
                const { notificationEmitter } = await import('@/lib/notifications-server');

                // Try to get the sender's name from the DB just in case payload.name is missing
                const senderUser = await db.user.findUnique({
                    where: { id: payload.userId },
                    select: { name: true }
                });
                const assignerName = senderUser?.name || payload.name || 'Someone';

                for (const userId of newlyAddedIds) {
                    try {
                        const notification = await db.notification.create({
                            data: {
                                userId,
                                type: 'TASK_ASSIGNMENT',
                                title: 'New Task Assigned',
                                content: `Hi, ${assignerName} has assigned you with a new task: ${updatedTask.name}`,
                                link: `/board/${task.boardId}?highlight=${taskId}`,
                            }
                        });

                        notificationEmitter.emitNotification(userId, {
                            ...notification,
                            senderName: assignerName
                        });
                    } catch (err) {
                        console.error(`Failed to trigger notification for user ${userId}:`, err);
                    }
                }
            }
        }

        return NextResponse.json(updatedTask);
    } catch (error) {
        console.error('Task update error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const taskId = params.id;

        // Verify task exists and belongs to org
        const task = await db.task.findUnique({
            where: { id: taskId },
            include: { board: { include: { department: true } } }
        });

        if (!task || task.board.department.organizationId !== payload.orgId) {
            return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
        }

        // Delete subtasks first, then the task itself
        await db.task.deleteMany({ where: { parentTaskId: taskId } });
        await db.task.delete({ where: { id: taskId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete task error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

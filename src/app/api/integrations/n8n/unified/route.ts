import { NextRequest, NextResponse } from 'next/server';
import { db, hashPassword } from '@/lib/auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema for the unified automation request
const unifiedRequestSchema = z.object({
    externalId: z.string(),
    name: z.string(),
    department: z.string().optional().default('General'),
    board: z.string().optional().default('Inbox'),
    group: z.string().optional().default('Active Nodes'),

    // Standard Column Values
    personEmail: z.string().email().optional(),
    status: z.string().optional(),
    importance: z.string().optional(),
    urgency: z.string().optional(),
    taskLoad: z.string().optional(),
    dueDate: z.string().optional(), // ISO string

    // Configuration for Column Options (Auto-setup for Board)
    config: z.object({
        statusLabels: z.record(z.string(), z.string()).optional(), // { "done": "#00c875", ... }
        importanceLabels: z.record(z.string(), z.string()).optional(),
        urgencyLabels: z.record(z.string(), z.string()).optional(),
        taskLoadLabels: z.record(z.string(), z.string()).optional(),
    }).optional(),

    // Catch-all for other custom columns
    customColumns: z.record(z.string(), z.any()).optional(),
});

export async function GET() {
    return NextResponse.json({
        status: 'online',
        service: 'Unified Automation API',
        description: 'This endpoint is designed for POST requests from automation tools like n8n.',
        authentication: 'Requires x-api-key header',
        documentation: 'See project walkthrough for payload structure'
    });
}

export async function POST(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    // 1. Validate API Key
    const keyRecord = await db.apiKey.findUnique({
        where: { key: apiKey },
        include: { organization: true },
    });

    if (!keyRecord) {
        return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const orgId = keyRecord.organizationId;

    // 2. Parse Body
    let data;
    try {
        const body = await req.json();
        data = unifiedRequestSchema.parse(body);
    } catch (error) {
        console.error('Unified API Parsing Error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Invalid Request Body', details: (error as Error).message }, { status: 400 });
    }

    try {
        const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
            // A. Ensure Department
            let dept = await tx.department.findFirst({
                where: { organizationId: orgId, name: data.department },
            });
            if (!dept) {
                dept = await tx.department.create({
                    data: { name: data.department, organizationId: orgId },
                });
            }

            // B. Ensure Board & Columns Configuration
            let board = await tx.board.findFirst({
                where: { departmentId: dept.id, name: data.board },
            });

            const defaultColumns = [
                { id: 'item', type: 'text', title: 'Item', width: 300 },
                { id: 'person', type: 'person', title: 'Person', width: 60 },
                {
                    id: 'status', type: 'status', title: 'Status', width: 140,
                    settings: { labels: data.config?.statusLabels || { 'done': '#00c875', 'working': '#fdab3d', 'stuck': '#e2445c', 'default': '#c4c4c4' } }
                },
                {
                    id: 'importance', type: 'status', title: 'Importance', width: 140,
                    settings: { labels: data.config?.importanceLabels || { 'high': '#ff158a', 'medium': '#784bd1', 'low': '#0086c0', 'default': '#c4c4c4' } }
                },
                {
                    id: 'urgency', type: 'status', title: 'Urgency', width: 140,
                    settings: { labels: data.config?.urgencyLabels || { 'critical': '#333333', 'urgent': '#ff642e', 'normal': '#00c875', 'default': '#c4c4c4' } }
                },
                {
                    id: 'taskLoad', type: 'status', title: 'Task Load', width: 140,
                    settings: { labels: data.config?.taskLoadLabels || { 'heavy': '#ffcb00', 'moderate': '#00d1d1', 'light': '#9cd326', 'default': '#c4c4c4' } }
                },
                { id: 'date', type: 'date', title: 'Timeline', width: 160 },
            ];

            if (!board) {
                board = await tx.board.create({
                    data: {
                        name: data.board,
                        departmentId: dept.id,
                        columns: JSON.stringify(defaultColumns),
                    },
                });
            } else if (data.config) {
                // Update existing board columns if config is provided
                const existingColumns = JSON.parse(board.columns);
                const updatedColumns = existingColumns.map((col: any) => {
                    if (col.id === 'status' && data.config?.statusLabels) col.settings.labels = { ...col.settings.labels, ...data.config.statusLabels };
                    if (col.id === 'importance' && data.config?.importanceLabels) col.settings.labels = { ...col.settings.labels, ...data.config.importanceLabels };
                    if (col.id === 'urgency' && data.config?.urgencyLabels) col.settings.labels = { ...col.settings.labels, ...data.config.urgencyLabels };
                    if (col.id === 'taskLoad' && data.config?.taskLoadLabels) col.settings.labels = { ...col.settings.labels, ...data.config.taskLoadLabels };
                    return col;
                });

                board = await tx.board.update({
                    where: { id: board.id },
                    data: { columns: JSON.stringify(updatedColumns) }
                });
            }

            // C. Ensure Group
            let group = await tx.group.findFirst({
                where: { boardId: board.id, title: data.group },
            });
            if (!group) {
                group = await tx.group.create({
                    data: { title: data.group, boardId: board.id, color: '#6366f1' },
                });
            }

            // D. Resolve Person
            let assignedUserId: string | null = null;
            if (data.personEmail) {
                let user = await tx.user.findUnique({ where: { email: data.personEmail } });
                if (!user) {
                    user = await tx.user.create({
                        data: {
                            email: data.personEmail,
                            name: data.personEmail.split('@')[0],
                            password: await hashPassword(Math.random().toString(36)),
                            organizationId: orgId,
                            role: 'MEMBER'
                        }
                    });
                }
                if (user.organizationId === orgId) {
                    assignedUserId = user.id;
                }
            }

            // E. Prepare Column Values
            const columnValues: Record<string, any> = {
                status: data.status,
                importance: data.importance,
                urgency: data.urgency,
                taskLoad: data.taskLoad,
                date: data.dueDate,
                ...data.customColumns
            };

            // F. Upsert Task
            const existingTask = await tx.task.findFirst({
                where: {
                    externalId: data.externalId,
                    board: { department: { organizationId: orgId } }
                }
            });

            if (existingTask) {
                const updatedTask = await tx.task.update({
                    where: { id: existingTask.id },
                    data: {
                        name: data.name,
                        boardId: board.id,
                        groupId: group.id,
                        assignedUserId: assignedUserId || existingTask.assignedUserId,
                        columnValues: JSON.stringify({ ...JSON.parse(existingTask.columnValues), ...columnValues })
                    }
                });
                return { action: 'updated', taskId: updatedTask.id };
            } else {
                const newTask = await tx.task.create({
                    data: {
                        name: data.name,
                        externalId: data.externalId,
                        boardId: board.id,
                        groupId: group.id,
                        assignedUserId: assignedUserId,
                        columnValues: JSON.stringify(columnValues),
                        state: 'ACTIVE'
                    }
                });
                return { action: 'created', taskId: newTask.id };
            }
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Unified API Error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

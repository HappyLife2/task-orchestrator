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
    personEmail: z.string().email().optional().or(z.literal('')),
    status: z.string().optional().default('To Be Actioned'),
    importance: z.string().optional().default('High'),
    urgency: z.string().optional().default('Upcoming'),
    taskLoad: z.string().optional().default('Light'),
    dueDate: z.string().optional(), // ISO string

    // Configuration for Column Options (Auto-setup for Board)
    config: z.object({
        statusLabels: z.record(z.string(), z.string()).optional(), // { "done": "#00c875", ... }
        importanceLabels: z.record(z.string(), z.string()).optional(),
        urgencyLabels: z.record(z.string(), z.string()).optional(),
        taskLoadLabels: z.record(z.string(), z.string()).optional(),
    }).optional(),

    // Catch-all for other custom columns
    customColumns: z.preprocess((val) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return {}; }
        }
        return val || {};
    }, z.record(z.string(), z.any())).optional().default({}),

    // Optional initial update/comment
    updateContent: z.string().optional(),
    authorEmail: z.string().email().optional(),
});

export async function GET(req: NextRequest) {
    const acceptHeader = req.headers.get('accept') || '';
    const isBrowser = acceptHeader.includes('text/html') && !acceptHeader.includes('application/json');

    if (isBrowser) {
        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
                    <div style="text-align: center; padding: 2rem; border-radius: 12px; background: white; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <h2 style="margin-top: 0;">Unified API Endpoint</h2>
                        <p style="color: #64748b;">This endpoint requires POST requests with an x-api-key.</p>
                        <a href="/api/n8n" style="display: inline-block; padding: 0.5rem 1rem; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">View Full Documentation Hub</a>
                    </div>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }

    return NextResponse.json({ error: 'This endpoint requires POST requests with an x-api-key.' }, { status: 405 });
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
        const rawBody = await req.json();
        console.log('--- Unified API Request Body ---');
        console.log(JSON.stringify(rawBody, null, 2));

        // Auto-merge unknown fields into customColumns for better DX
        const knownKeys = [
            'externalId', 'name', 'department', 'board', 'group',
            'personEmail', 'status', 'importance', 'urgency', 'taskLoad',
            'dueDate', 'config', 'customColumns', 'updateContent', 'authorEmail'
        ];

        const extractedCustom = { ...(typeof rawBody.customColumns === 'object' ? rawBody.customColumns : {}) };
        if (typeof rawBody.customColumns === 'string') {
            try { Object.assign(extractedCustom, JSON.parse(rawBody.customColumns)); } catch (e) { }
        }

        Object.keys(rawBody).forEach(key => {
            if (!knownKeys.includes(key)) {
                extractedCustom[key] = rawBody[key];
            }
        });

        rawBody.customColumns = extractedCustom;
        data = unifiedRequestSchema.parse(rawBody);
    } catch (error) {
        console.error('Unified API Parsing Error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Invalid Fields',
                details: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
            }, { status: 400 });
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
                { id: 'created_date', type: 'text', title: 'Created Date', width: 150 },
                { id: 'reference_id', type: 'text', title: 'Reference ID', width: 130 },
                { id: 'requester_name', type: 'text', title: 'Requester Name', width: 150 },
                { id: 'request_type', type: 'text', title: 'Request Type', width: 150 },
                {
                    id: 'importance', type: 'status', title: 'Importance', width: 140, hidden: true,
                    settings: { labels: data.config?.importanceLabels || { 'high': '#ff158a', 'medium': '#784bd1', 'low': '#0086c0', 'default': '#c4c4c4' } }
                },
                {
                    id: 'urgency', type: 'status', title: 'Urgency', width: 140, hidden: true,
                    settings: { labels: data.config?.urgencyLabels || { 'critical': '#333333', 'urgent': '#ff642e', 'normal': '#00c875', 'default': '#c4c4c4' } }
                },
                {
                    id: 'taskLoad', type: 'status', title: 'Task Load', width: 140, hidden: true,
                    settings: { labels: data.config?.taskLoadLabels || { 'heavy': '#ffcb00', 'moderate': '#00d1d1', 'light': '#9cd326', 'default': '#c4c4c4' } }
                },
                { id: 'date', type: 'date', title: 'Timeline', width: 160, hidden: true },
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

            // E. Intelligent Column Mapping
            const boardColumns = JSON.parse(board.columns || '[]');
            const columnLookup: Record<string, string> = {};

            boardColumns.forEach((col: any) => {
                const normalizedId = col.id.toLowerCase().replace(/[^a-z0-9]/g, '');
                const normalizedTitle = col.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                columnLookup[normalizedId] = col.id;
                columnLookup[normalizedTitle] = col.id;
            });

            const inputs: Record<string, any> = {
                status: data.status,
                importance: data.importance,
                urgency: data.urgency,
                taskload: data.taskLoad,
                date: data.dueDate,
                ...data.customColumns
            };

            const columnValues: Record<string, any> = {};
            const newColumns: any[] = [];

            Object.entries(inputs).forEach(([key, val]) => {
                if (val === undefined || val === null) return;
                const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                const targetId = columnLookup[normalizedKey] || columnLookup[key.toLowerCase()];

                if (targetId) {
                    const colDef = boardColumns.find((c: any) => c.id === targetId);
                    if (colDef && (colDef.type === 'status' || colDef.type === 'dropdown')) {
                        let options = colDef.settings?.labels || colDef.settings?.options || colDef.settings?.status?.labels || colDef.settings || {};

                        if (Array.isArray(options)) {
                            // Dropdown style
                            const match = options.find((opt: any) =>
                                opt.label?.toLowerCase() === String(val).toLowerCase() ||
                                opt.value?.toLowerCase() === String(val).toLowerCase()
                            );
                            columnValues[targetId] = match ? match.value : val;
                        } else {
                            // Status style
                            const match = Object.keys(options).find(k => k.toLowerCase() === String(val).toLowerCase());
                            columnValues[targetId] = match || val;
                        }
                    } else {
                        columnValues[targetId] = val;
                    }
                } else {
                    // AUTO-PROVISION: Add new column to board definition
                    const newId = key.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    const newTitle = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');

                    newColumns.push({
                        id: newId,
                        type: 'text',
                        title: newTitle,
                        width: 140
                    });

                    columnValues[newId] = val;
                }
            });

            // If we found new columns, update the board definition
            if (newColumns.length > 0) {
                const updatedBoardColumns = [...boardColumns, ...newColumns];
                board = await tx.board.update({
                    where: { id: board.id },
                    data: { columns: JSON.stringify(updatedBoardColumns) }
                });
            }

            // F. Upsert Task
            const existingTask = await tx.task.findFirst({
                where: {
                    externalId: data.externalId,
                    board: { department: { organizationId: orgId } }
                }
            });

            let finalTaskId: string;
            let action: 'created' | 'updated';

            if (existingTask) {
                const updatedTask = await tx.task.update({
                    where: { id: existingTask.id },
                    data: {
                        name: data.name,
                        boardId: board.id,
                        groupId: group.id,
                        assignedUsers: assignedUserId ? { set: [{ id: assignedUserId }] } : undefined,
                        columnValues: JSON.stringify({ ...JSON.parse(existingTask.columnValues), ...columnValues })
                    }
                });
                finalTaskId = updatedTask.id;
                action = 'updated';
            } else {
                const newTask = await tx.task.create({
                    data: {
                        name: data.name,
                        externalId: data.externalId,
                        boardId: board.id,
                        groupId: group.id,
                        assignedUsers: assignedUserId ? { connect: [{ id: assignedUserId }] } : undefined,
                        columnValues: JSON.stringify(columnValues),
                        state: 'ACTIVE'
                    }
                });
                finalTaskId = newTask.id;
                action = 'created';
            }

            // G. Handle Optional Update/Comment
            if (data.updateContent && finalTaskId) {
                const authorEmail = data.authorEmail || data.personEmail || 'api-bot@psi.tech';
                let author = await tx.user.findUnique({ where: { email: authorEmail } });

                if (!author) {
                    author = await tx.user.create({
                        data: {
                            email: authorEmail,
                            name: authorEmail.split('@')[0],
                            password: await hashPassword(Math.random().toString(36)),
                            organizationId: orgId,
                            role: 'MEMBER'
                        }
                    });
                }

                await tx.update.create({
                    data: {
                        content: data.updateContent,
                        taskId: finalTaskId,
                        userId: author.id
                    }
                });
            }

            return {
                action: existingTask ? 'updated' : 'created',
                taskId: finalTaskId
            };
        });

        return NextResponse.json({
            ...result,
            externalId: data.externalId
        });

    } catch (error) {
        console.error('Unified API Error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

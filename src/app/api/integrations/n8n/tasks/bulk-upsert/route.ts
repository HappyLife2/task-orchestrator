import { NextRequest, NextResponse } from 'next/server';
import { db, hashPassword } from '@/lib/auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema for a single task item
const taskItemSchema = z.object({
    externalId: z.string(),
    name: z.string(),
    department: z.string().optional().default('General'), // Name of department
    board: z.string().optional().default('Inbox'), // Name of board
    column_values: z.array(z.object({
        id: z.string(),
        value: z.any().optional(),
        text: z.string().optional(),
        email: z.string().email().optional(), // For person column auto-create
    })).optional(),
});

const bulkUpsertSchema = z.array(taskItemSchema);

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
    let items;
    try {
        const body = await req.json();
        items = bulkUpsertSchema.parse(body);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Invalid User Request Body' }, { status: 400 });
    }

    const results = {
        processed: 0,
        created: 0,
        updated: 0,
        errors: [] as any[],
    };

    // 3. Process Items
    // We process sequentially or in parallel? Parallel is riskier for "auto-create board" race conditions.
    // Sequential for safety on create logic.

    for (const item of items) {
        try {
            await db.$transaction(async (tx: Prisma.TransactionClient) => {
                // A. Ensure Department
                let dept = await tx.department.findFirst({
                    where: { organizationId: orgId, name: item.department },
                });
                if (!dept) {
                    dept = await tx.department.create({
                        data: { name: item.department, organizationId: orgId },
                    });
                }

                // B. Ensure Board
                let board = await tx.board.findFirst({
                    where: { departmentId: dept.id, name: item.board },
                });
                if (!board) {
                    // Create with default columns
                    const defaultColumns = [
                        { id: 'person', type: 'person', title: 'Person', width: 100 },
                        {
                            id: 'status', type: 'status', title: 'Status', width: 140, settings: {
                                labels: { 'done': '#00c875', 'working': '#fdab3d', 'stuck': '#e2445c', 'default': '#c4c4c4' }
                            }
                        },
                        { id: 'date', type: 'date', title: 'Date', width: 120 },
                    ];
                    board = await tx.board.create({
                        data: {
                            name: item.board,
                            departmentId: dept.id,
                            columns: JSON.stringify(defaultColumns),
                        },
                    });
                }

                // C. Handle Person Auto-Creation and Column Parsing
                const parsedColumns: Record<string, any> = {};
                let assignedUserId: string | null = null;

                if (item.column_values) {
                    for (const col of item.column_values) {
                        // If column is 'person' and has email, try to find/create user
                        if (col.id === 'person' && col.email) {
                            let user = await tx.user.findUnique({ where: { email: col.email } });
                            if (!user) {
                                // Create dummy user (invited state ideally, but here just active member with random pass)
                                const randomPass = Math.random().toString(36);
                                user = await tx.user.create({
                                    data: {
                                        email: col.email,
                                        name: col.text || col.email.split('@')[0],
                                        password: await hashPassword(randomPass),
                                        role: 'MEMBER',
                                        organizationId: orgId,
                                    },
                                });
                                // In a real app, send invite email here
                            }
                            // Check if user belongs to this org
                            if (user.organizationId === orgId) {
                                parsedColumns[col.id] = user.id;
                                if (!assignedUserId) assignedUserId = user.id; // Assign first person found
                            }
                        } else {
                            // Standard value mapping
                            parsedColumns[col.id] = col.value || col.text;
                        }
                    }
                }

                // D. Upsert Task
                // We search by externalId AND boardId? Or just externalId within Org?
                // User request: "Upsert by externalId", "Prevent duplicate tasks using externalId + orgId".
                // So externalId should be unique per Org (or handled globally per org).
                // Since externalId field in schema is not unique constraint, using findFirst.

                const existingTask = await tx.task.findFirst({
                    where: {
                        externalId: item.externalId,
                        board: {
                            department: {
                                organizationId: orgId
                            }
                        }
                    }
                });

                if (existingTask) {
                    // Update
                    await tx.task.update({
                        where: { id: existingTask.id },
                        data: {
                            name: item.name,
                            // Update board? If changed, move it?
                            // Logic: validation "Board belongs to org" is implicit via findFirst above.
                            // If board name changed in payload, we should move it.
                            boardId: board.id,
                            columnValues: JSON.stringify({ ...JSON.parse(existingTask.columnValues), ...parsedColumns }),
                            assignedUserId: assignedUserId || existingTask.assignedUserId, // Update only if new one provided
                        }
                    });
                    results.updated++;
                } else {
                    // Create
                    await tx.task.create({
                        data: {
                            name: item.name,
                            externalId: item.externalId,
                            boardId: board.id,
                            columnValues: JSON.stringify(parsedColumns),
                            assignedUserId: assignedUserId,
                            state: 'ACTIVE'
                        }
                    });
                    results.created++;
                }
            }); // End Transaction

            results.processed++;

        } catch (err: any) {
            console.error(err);
            results.errors.push({ externalId: item.externalId, error: err.message });
        }
    }

    return NextResponse.json(results);
}

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
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unified Automation API | Documentation</title>
    <style>
        :root {
            --primary: #6366f1;
            --bg: #030712;
            --card: #111827;
            --text: #f3f4f6;
            --text-muted: #9ca3af;
            --accent: #4f46e5;
            --code-bg: #1f2937;
        }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
        }
        .container { max-width: 900px; width: 100%; }
        .header {
            text-align: center;
            margin-bottom: 60px;
            padding: 40px;
            background: linear-gradient(135deg, #1e1b4b 0%, #030712 100%);
            border-radius: 24px;
            border: 1px solid #2e1065;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        h1 { font-size: 2.5rem; margin-bottom: 0.5rem; color: #fff; }
        .badge {
            background: rgba(99, 102, 241, 0.1);
            color: var(--primary);
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid rgba(99, 102, 241, 0.2);
            text-transform: uppercase;
        }
        .section {
            background: var(--card);
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 32px;
            border: 1px solid #1f2937;
        }
        h2 { font-size: 1.5rem; margin-top: 0; color: #fff; border-bottom: 1px solid #1f2937; padding-bottom: 12px; margin-bottom: 20px; }
        .endpoint {
            font-family: monospace;
            background: var(--code-bg);
            padding: 16px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            margin: 16px 0;
            border: 1px solid #374151;
        }
        .method {
            background: #059669;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 800;
            margin-right: 12px;
        }
        pre {
            background: #000;
            padding: 24px;
            border-radius: 12px;
            overflow-x: auto;
            border: 1px solid #374151;
            font-size: 0.9rem;
        }
        code { font-family: 'Fira Code', monospace; }
        .property { color: var(--primary); }
        .type { color: #10b981; margin-left: 8px; font-size: 0.8rem; }
        .info-box {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.2);
            padding: 16px;
            border-radius: 12px;
            margin: 20px 0;
            color: #fbbf24;
        }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="badge">Enterprise Automation</span>
            <h1>Unified API Documentation</h1>
            <p style="color: var(--text-muted)">v1.2 - Dynamic Board & Task Orchestration</p>
        </div>

        <div class="section">
            <h2>1. Discovery (Important)</h2>
            <p>To automate successfully, you need the correct IDs for Boards, Groups, and Users. We provide a metadata tool specifically for this:</p>
            <div class="endpoint">
                <span class="method" style="background: var(--primary)">GET</span> /api/n8n/metadata
            </div>
            <p><strong>Authentication:</strong> Header <code>x-api-key</code></p>
            <p>This returns a JSON map of all your Boards, their Group IDs, and the exact "Status Choice IDs" you need for your payloads.</p>
        </div>

        <div class="section">
            <h2>2. Creating/Updating Tasks</h2>
            <div class="endpoint">
                <span class="method">POST</span> /api/n8n/unified
            </div>
            
            <div class="grid">
                <div>
                    <h3>Identification</h3>
                    <p class="desc">The <code>externalId</code> is your primary key from n8n. If you send the same ID twice, the task is updated instead of duplicated.</p>
                </div>
                <div>
                    <h3>Dynamic Creation</h3>
                    <p class="desc">If you provide a <code>board</code> or <code>group</code> name that doesn't exist, the API creates it on the fly.</p>
                </div>
            </div>

            <pre><code>{
  <span class="property">"externalId"</span>: <span class="type">"n8n-node-001"</span>,
  <span class="property">"name"</span>: <span class="type">"New Pipeline Item"</span>,
  <span class="property">"department"</span>: <span class="type">"Engineering"</span>,
  <span class="property">"board"</span>: <span class="type">"Quantum Nodes"</span>,
  <span class="property">"group"</span>: <span class="type">"In Production"</span>,
  <span class="property">"status"</span>: <span class="type">"Done"</span>, <span class="property">// Choice ID from Metadata API</span>
  <span class="property">"personEmail"</span>: <span class="type">"lead@agency.com"</span>
}</code></pre>
        </div>

        <div class="section">
            <h2>3. Using Results in n8n</h2>
            <p>Success responses (201/200) return a JSON object containing the internal <code>taskId</code> and your <code>externalId</code>.</p>
            <div class="info-box">
                <strong>Tip:</strong> Always map the returned <code>taskId</code> or <code>externalId</code> to successive n8n nodes (like the Updates API) to ensure you are targeting the correct artifact.
            </div>
            <pre><code>{
  <span class="property">"action"</span>: <span class="type">"created"</span>,
  <span class="property">"taskId"</span>: <span class="type">"550e8400-e29b-41d4-a716-446655440000"</span>,
  <span class="property">"externalId"</span>: <span class="type">"n8n-node-001"</span>
}</code></pre>
        </div>
    </div>
</body>
</html>
    `;
    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
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

        return NextResponse.json({
            ...result,
            externalId: data.externalId
        });

    } catch (error) {
        console.error('Unified API Error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { db, hashPassword } from '@/lib/auth';
import { z } from 'zod';

const createUpdateSchema = z.object({
    externalId: z.string(),
    authorEmail: z.string().email(),
    content: z.string().min(1),
    parentId: z.string().uuid().optional(),
});

export async function GET() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Automated Updates API | Documentation</title>
    <style>
        :root {
            --primary: #10b981;
            --bg: #030712;
            --card: #111827;
            --text: #f3f4f6;
            --text-muted: #9ca3af;
            --accent: #059669;
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
        .container { max-width: 800px; width: 100%; }
        .header {
            text-align: center;
            margin-bottom: 60px;
            padding: 40px;
            background: linear-gradient(135deg, #064e3b 0%, #030712 100%);
            border-radius: 24px;
            border: 1px solid #065f46;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; color: #fff; }
        .badge {
            background: rgba(16, 185, 129, 0.1);
            color: var(--primary);
            padding: 6px 12px;
            border-radius: 99px;
            font-size: 0.875rem;
            font-weight: 600;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .section {
            background: var(--card);
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 32px;
            border: 1px solid #1f2937;
        }
        h2 { font-size: 1.5rem; margin-top: 0; color: #fff; border-bottom: 1px solid #1f2937; padding-bottom: 12px; }
        .endpoint {
            font-family: monospace;
            background: var(--code-bg);
            padding: 12px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            margin: 16px 0;
            border: 1px solid #374151;
        }
        .method {
            background: #059669;
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.8rem;
            margin-right: 8px;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="badge">Messaging Gateway</span>
            <h1>Automated Updates API</h1>
            <p style="color: var(--text-muted)">Sync external events as task comments in real-time.</p>
        </div>

        <div class="section">
            <h2>Endpoint</h2>
            <div class="endpoint">
                <span class="method">POST</span> /api/n8n/updates
            </div>
            <p><strong>Required Headers:</strong> <code>x-api-key</code></p>
        </div>

        <div class="section">
            <h2>Addressing Tasks</h2>
            <p>You can target tasks using the <code>externalId</code> you provided during creation.</p>
            <pre><code>{
  <span class="property">"externalId"</span>: <span class="type">"n8n-node-001"</span>,
  <span class="property">"authorEmail"</span>: <span class="type">"n8n-bot@agency.com"</span>,
  <span class="property">"content"</span>: <span class="type">"Pipeline updated check results..."</span>
}</code></pre>
        </div>

        <div class="section">
            <h2>Rich Media Support</h2>
            <p>The <code>content</code> field supports Markdown and HTML. Headlines and lists will be rendered with full styling in the activity feed.</p>
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
        data = createUpdateSchema.parse(body);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Invalid Request Body' }, { status: 400 });
    }

    try {
        // 3. Resolve Task by externalId
        const task = await db.task.findFirst({
            where: {
                externalId: data.externalId,
                board: {
                    department: {
                        organizationId: orgId
                    }
                }
            }
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // 4. Resolve or Create Author
        let user = await db.user.findUnique({
            where: { email: data.authorEmail }
        });

        if (!user) {
            user = await db.user.create({
                data: {
                    email: data.authorEmail,
                    name: data.authorEmail.split('@')[0],
                    password: await hashPassword(Math.random().toString(36)),
                    organizationId: orgId,
                    role: 'MEMBER'
                }
            });
        }

        // Verify user belongs to the same org
        if (user.organizationId !== orgId) {
            return NextResponse.json({ error: 'Author does not belong to this organization' }, { status: 403 });
        }

        // 5. Create Update
        const update = await db.update.create({
            data: {
                content: data.content,
                taskId: task.id,
                userId: user.id,
                parentId: data.parentId
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(update, { status: 201 });

    } catch (error) {
        console.error('Automated Update Error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

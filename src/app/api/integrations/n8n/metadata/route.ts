import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Metadata Discovery API | Documentation</title>
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
            background: #10b981;
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.8rem;
            margin-right: 8px;
        }
        pre {
            background: #000;
            padding: 20px;
            border-radius: 10px;
            overflow-x: auto;
            border: 1px solid #374151;
            color: #10b981;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="badge">Discovery Tool</span>
            <h1>Metadata Discovery API</h1>
            <p style="color: var(--text-muted)">Query your organization structure to find Board, Group, and Choice IDs.</p>
        </div>

        <div class="section">
            <h2>Authentication</h2>
            <p>This endpoint requires an active <code>x-api-key</code> in the request headers.</p>
            <div class="endpoint">
                <span class="method">GET</span> /api/n8n/metadata
            </div>
            <p><strong>Example Header:</strong> <code>x-api-key: your-secure-key</code></p>
        </div>

        <div class="section">
            <h2>What's Included?</h2>
            <ul>
                <li><strong>Board IDs</strong>: Required for task creation.</li>
                <li><strong>Group IDs</strong>: Targeted group for task placement.</li>
                <li><strong>Status Choice IDs</strong>: Valid values for your custom status columns.</li>
                <li><strong>User Data</strong>: Email-to-ID mappings for task ownership.</li>
            </ul>
        </div>
    </div>
</body>
</html>
        `;
        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html' }
        });
    }

    try {
        // 1. Validate API Key and get Organization
        const keyRecord = await db.apiKey.findUnique({
            where: { key: apiKey },
            include: { organization: true },
        });

        if (!keyRecord) {
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
        }

        const orgId = keyRecord.organizationId;

        // 2. Fetch full structure
        const departments = await db.department.findMany({
            where: { organizationId: orgId },
            include: {
                boards: {
                    include: {
                        groups: {
                            orderBy: { position: 'asc' }
                        }
                    }
                }
            }
        });

        // 3. Map to useful metadata structure
        const metadata = departments.map(dept => ({
            id: dept.id,
            name: dept.name,
            boards: dept.boards.map(board => {
                // Parse columns to extract status choices
                let columns = [];
                try {
                    columns = JSON.parse(board.columns || '[]');
                } catch (e) {
                    columns = [];
                }

                const statusColumns = columns.filter((c: any) => c.type === 'status');

                return {
                    id: board.id,
                    name: board.name,
                    groups: board.groups.map(g => ({
                        id: g.id,
                        name: g.title
                    })),
                    columns: statusColumns.map((col: any) => ({
                        id: col.id,
                        name: col.title || col.id,
                        choices: Object.entries(col.settings?.labels || col.settings || {}).map(([label, color]) => ({
                            id: label,
                            color: color
                        }))
                    }))
                };
            })
        }));

        // 4. Fetch Users (for person assignment)
        const users = await db.user.findMany({
            where: { organizationId: orgId },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        return NextResponse.json({
            organization: keyRecord.organization.name,
            structure: metadata,
            availableUsers: users
        });

    } catch (error) {
        console.error('Metadata API Error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

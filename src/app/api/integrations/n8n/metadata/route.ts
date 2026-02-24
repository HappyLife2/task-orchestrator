import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');
    const acceptHeader = req.headers.get('accept') || '';
    const isBrowser = acceptHeader.includes('text/html');

    if (!apiKey) {
        if (isBrowser) {
            return new NextResponse(`
                <html>
                    <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
                        <div style="text-align: center; padding: 2rem; border-radius: 12px; background: white; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                            <h2 style="margin-top: 0;">Metadata Discovery API</h2>
                            <p style="color: #64748b;">This endpoint requires an x-api-key header to retrieve data.</p>
                            <a href="/api/n8n" style="display: inline-block; padding: 0.5rem 1rem; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">View Full Documentation Hub</a>
                        </div>
                    </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html' }
            });
        }
        return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    try {
        const keyRecord = await db.apiKey.findUnique({
            where: { key: apiKey },
            include: { organization: true },
        });

        if (!keyRecord) {
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
        }

        const orgId = keyRecord.organizationId;
        const departments = await db.department.findMany({
            where: { organizationId: orgId },
            include: {
                boards: {
                    include: {
                        groups: { orderBy: { position: 'asc' } }
                    }
                }
            }
        });

        // Grouped & Flattened Maps for easy n8n usage
        const boardsMap: Record<string, string> = {};
        const groupsMap: Record<string, Record<string, string>> = {};
        const statusChoicesMap: Record<string, Record<string, any>> = {};

        departments.forEach(dept => {
            dept.boards.forEach(board => {
                boardsMap[board.name] = board.id;

                const gMap: Record<string, string> = {};
                board.groups.forEach(g => {
                    gMap[g.title] = g.id;
                });
                groupsMap[board.id] = gMap;

                let columns = [];
                try {
                    columns = JSON.parse(board.columns || '[]');
                } catch (e) {
                    columns = [];
                }

                const sMap: Record<string, any> = {};
                columns.filter((c: any) => c.type === 'status').forEach((col: any) => {
                    const choices: Record<string, string> = {};
                    Object.entries(col.settings?.labels || col.settings || {}).forEach(([label, color]) => {
                        choices[label] = label; // In our system labels are the IDs for status
                    });
                    sMap[col.title || col.id] = choices;
                });
                statusChoicesMap[board.id] = sMap;
            });
        });

        const users = await db.user.findMany({
            where: { organizationId: orgId },
            select: { id: true, name: true, email: true }
        });

        return NextResponse.json({
            organization: keyRecord.organization.name,
            boards: boardsMap,
            groupsByBoardId: groupsMap,
            statusChoicesByBoardId: statusChoicesMap,
            users: users.reduce((acc: any, u) => {
                acc[u.email] = u.id;
                return acc;
            }, {}),
            rawStructure: departments // Kept for advanced users
        });

    } catch (error) {
        console.error('Metadata API Error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

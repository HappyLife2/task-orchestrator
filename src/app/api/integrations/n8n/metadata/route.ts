import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');
    const acceptHeader = req.headers.get('accept') || '';
    // Only treat as browser if text/html is explicitly requested AND application/json is NOT.
    const isBrowser = acceptHeader.includes('text/html') && !acceptHeader.includes('application/json');

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

        const users = await db.user.findMany({
            where: { organizationId: orgId },
            select: { id: true, name: true, email: true }
        });

        // Re-engineer the discovery structure to be more intuitive
        const boardDiscovery = departments.flatMap(dept =>
            dept.boards.map(board => {
                const gMap: Record<string, string> = {};
                board.groups.forEach(g => { gMap[g.title] = g.id; });

                let columns = [];
                try {
                    columns = JSON.parse(board.columns || '[]');
                } catch (e) {
                    columns = [];
                }

                const cMap: Record<string, any> = {};
                columns.forEach((col: any) => {
                    const columnKey = col.title || col.id;
                    if (['status', 'dropdown'].includes(col.type)) {
                        const choices: Record<string, string> = {};
                        let options = col.settings?.labels || col.settings?.options || col.settings?.status?.labels || col.settings || {};

                        if (Array.isArray(options)) {
                            options.forEach((opt: any) => {
                                choices[opt.label] = opt.value || opt.label;
                            });
                        } else {
                            Object.entries(options).forEach(([label]) => {
                                if (typeof label === 'string' && label !== 'status' && label !== 'labels') {
                                    choices[label] = label;
                                }
                            });
                        }
                        cMap[columnKey] = choices;
                    } else {
                        // For non-dropdown columns (like text), show the type so the user knows it exists
                        cMap[columnKey] = { _type: col.type };
                    }
                });

                return {
                    boardName: board.name,
                    boardId: board.id,
                    department: dept.name,
                    groups: gMap,
                    columns: cMap
                };
            })
        );

        return NextResponse.json({
            organization: keyRecord.organization.name,
            discovery: boardDiscovery,
            users: users.reduce((acc: any, u) => {
                acc[u.email] = u.id;
                return acc;
            }, {}),
            _schema: {
                discovery: "Array of boards. Each contains 'groups' (Name->ID) and 'columns' (Name->{ChoiceLabel->ChoiceID}).",
                users: "Map of User Email -> User ID"
            }
        });

    } catch (error) {
        console.error('Metadata API Error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    try {
        const tasks = await db.task.findMany({
            where: {
                board: {
                    department: {
                        workspace: {
                            organizationId: payload.orgId
                        }
                    }
                },
                OR: [
                    { name: { contains: query } },
                    { referenceId: { contains: query } },
                    { columnValues: { contains: query } }
                ]
            },
            select: {
                id: true,
                name: true,
                referenceId: true,
                boardId: true,
                groupId: true,
                board: {
                    select: {
                        name: true
                    }
                }
            },
            take: 10
        });

        return NextResponse.json({ results: tasks });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

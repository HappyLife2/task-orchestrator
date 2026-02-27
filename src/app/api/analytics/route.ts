import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const boards = await db.board.findMany({
            where: {
                department: {
                    organizationId: payload.orgId
                }
            },
            include: {
                groups: true,
                tasks: {
                    where: {
                        state: 'ACTIVE',
                        parentTaskId: null
                    }
                }
            }
        });

        const analytics = {
            ongoing: {
                total: 0,
                byBoard: {} as Record<string, number>,
                byStatus: {} as Record<string, number>,
                byImportance: {} as Record<string, number>,
                byUrgency: {} as Record<string, number>,
                byType: {} as Record<string, number>,
            },
            done: {
                total: 0,
                byBoard: {} as Record<string, number>,
                byStatus: {} as Record<string, number>,
                byImportance: {} as Record<string, number>,
                byUrgency: {} as Record<string, number>,
                byType: {} as Record<string, number>,
            }
        };

        boards.forEach(board => {
            // Explicitly initialize this board with 0 so it always appears on the chart
            analytics.ongoing.byBoard[board.name] = 0;
            analytics.done.byBoard[board.name] = 0;

            const groupMap: Record<string, string> = {};
            board.groups.forEach(g => {
                groupMap[g.id] = g.title;
            });

            board.tasks.forEach(task => {
                let columnValues: any = {};
                try {
                    columnValues = JSON.parse(task.columnValues || '{}');
                } catch (e) {
                    columnValues = {};
                }

                const status = (columnValues.status || '').toLowerCase();
                const importance = (columnValues.importance || 'none').toLowerCase();
                const urgency = (columnValues.urgency || 'none').toLowerCase();
                const groupTitle = task.groupId ? (groupMap[task.groupId] || 'Other') : 'Other';

                const target = status === 'done' ? analytics.done : analytics.ongoing;

                target.total++;

                // By Board
                target.byBoard[board.name] = (target.byBoard[board.name] || 0) + 1;

                // By Status
                const statusLabel = status || 'Not Started';
                target.byStatus[statusLabel] = (target.byStatus[statusLabel] || 0) + 1;

                // By Importance
                target.byImportance[importance] = (target.byImportance[importance] || 0) + 1;

                // By Urgency
                target.byUrgency[urgency] = (target.byUrgency[urgency] || 0) + 1;

                // By Type (Group)
                target.byType[groupTitle] = (target.byType[groupTitle] || 0) + 1;
            });
        });

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

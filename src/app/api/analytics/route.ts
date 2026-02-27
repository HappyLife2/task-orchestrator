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
                byRequestType: {} as Record<string, number>,
                byRequesterName: {} as Record<string, number>,
                byType: {} as Record<string, number>,
            },
            done: {
                total: 0,
                byBoard: {} as Record<string, number>,
                byStatus: {} as Record<string, number>,
                byRequestType: {} as Record<string, number>,
                byRequesterName: {} as Record<string, number>,
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
                const requestType = (columnValues.request_type || 'Unknown').toLowerCase();
                const requesterName = (columnValues.requester_name || 'Unknown').toLowerCase();
                const groupTitle = task.groupId ? (groupMap[task.groupId] || 'Other') : 'Other';

                const target = status === 'done' ? analytics.done : analytics.ongoing;

                target.total++;

                // By Board
                target.byBoard[board.name] = (target.byBoard[board.name] || 0) + 1;

                // By Status
                const statusLabel = status || 'Not Started';
                target.byStatus[statusLabel] = (target.byStatus[statusLabel] || 0) + 1;

                // By Request Type
                target.byRequestType[requestType] = (target.byRequestType[requestType] || 0) + 1;

                // By Requester
                target.byRequesterName[requesterName] = (target.byRequesterName[requesterName] || 0) + 1;

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

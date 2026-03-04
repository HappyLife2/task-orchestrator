import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: { boardId: string } }
) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const board = await db.board.findUnique({
        where: { id: params.boardId },
        include: {
            department: true,
            members: {
                where: { userId: payload.userId }
            }
        },
    });

    if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    if (!['ADMIN', 'OWNER'].includes(String(String(payload.role).toUpperCase()).toUpperCase()) && board.members.length === 0) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
        ...board,
        columns: JSON.parse(board.columns || '[]'),
    });
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { boardId: string } }
) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const boardCheck = await db.board.findUnique({
            where: { id: params.boardId },
            include: { members: { where: { userId: payload.userId } } }
        });

        if (!boardCheck) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Only allow admins or owners to rename boards
        if (!['ADMIN', 'OWNER'].includes(String(String(payload.role).toUpperCase()).toUpperCase())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, icon, description } = body;

        const board = await db.board.update({
            where: { id: params.boardId },
            data: {
                name,
                icon,
                description,
            },
        });

        return NextResponse.json(board);
    } catch (error) {
        console.error('Error updating board:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { boardId: string } }
) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const boardCheck = await db.board.findUnique({
            where: { id: params.boardId },
            include: { members: { where: { userId: payload.userId } } }
        });

        if (!boardCheck) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Only allow admins or owners to delete boards
        if (!['ADMIN', 'OWNER'].includes(String(String(payload.role).toUpperCase()).toUpperCase())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await db.board.delete({
            where: { id: params.boardId },
        });

        if (boardCheck.departmentId) {
            const dept = await db.department.findUnique({
                where: { id: boardCheck.departmentId },
                select: { organizationId: true }
            });

            if (dept) {
                await db.activityLog.create({
                    data: {
                        organizationId: dept.organizationId,
                        userId: payload.userId,
                        action: 'DELETE_BOARD',
                        resourceType: 'BOARD',
                        resourceId: params.boardId,
                        details: `Deleted board: ${boardCheck.name}`,
                    }
                });
            }
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting board:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

// GET /api/boards/[boardId]/tasks
export async function GET(req: NextRequest, { params }: { params: { boardId: string } }) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Need to await params in Next.js 15+ but this is 14 so it's fine?
    // Actually Next.js 15 requires awaiting params. Next 14 does not but suggests it?
    // Let's assume params is standard object for now or await it if it's a promise (safe).
    // But strictly `params` is not a promise in 14.
    const boardId = params.boardId;

    const board = await db.board.findUnique({
        where: { id: boardId },
        include: {
            department: true,
            members: { where: { userId: payload.userId } }
        }
    });

    if (!board || board.department.organizationId !== payload.orgId) {
        return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 });
    }

    if (payload.role !== 'ADMIN' && board.members.length === 0) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const tasks = await db.task.findMany({
        where: {
            boardId,
            parentTaskId: null // Only fetch root tasks
        },
        include: {
            subTasks: true,
            assignedUser: {
                select: { id: true, name: true, email: true }
            },
            creator: {
                select: { id: true, name: true, email: true }
            },
            _count: {
                select: { updates: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
}

// POST /api/boards/[boardId]/tasks
export async function POST(req: NextRequest, { params }: { params: { boardId: string } }) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const boardId = params.boardId;

    try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Verify board access
        const board = await db.board.findUnique({
            where: { id: boardId },
            include: {
                department: true,
                members: { where: { userId: payload.userId } }
            }
        });

        if (!board || board.department.organizationId !== payload.orgId) {
            return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 });
        }

        if (payload.role !== 'ADMIN' && board.members.length === 0) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Get max position to append to bottom
        const lastTask = await db.task.findFirst({
            where: { boardId, parentTaskId: null },
            orderBy: { position: 'desc' },
            select: { position: true }
        });

        const newPosition = (lastTask?.position ?? -1) + 1000;

        const task = await db.task.create({
            data: {
                name,
                boardId,
                creatorId: payload.userId,
                position: newPosition,
                state: 'ACTIVE',
                columnValues: '{}',
            },
            include: {
                assignedUser: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(task);

    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


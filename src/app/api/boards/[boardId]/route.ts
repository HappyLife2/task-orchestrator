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
        },
    });

    if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
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
        await db.board.delete({
            where: { id: params.boardId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting board:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

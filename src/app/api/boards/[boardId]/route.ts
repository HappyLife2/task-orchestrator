import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { boardId: string } }) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const boardId = params.boardId;

    const board = await db.board.findUnique({
        where: { id: boardId },
        include: { department: true }
    });

    if (!board || board.department.organizationId !== payload.orgId) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Parse columns JSON if needed or return as string (client can parse)
    // Let's parse it for convenience
    const boardData = {
        ...board,
        columns: JSON.parse(board.columns || '[]'),
    };

    return NextResponse.json(boardData);
}

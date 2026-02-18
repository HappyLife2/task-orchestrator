import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, departmentId } = body;

        if (!name || !departmentId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const board = await db.board.create({
            data: {
                name,
                departmentId,
            },
        });

        // Initialize default group
        await db.group.create({
            data: {
                boardId: board.id,
                title: 'Group Title',
                color: '#579bfc',
                position: 0,
            },
        });

        // Initialize default Table view
        await db.boardView.create({
            data: {
                boardId: board.id,
                name: 'Main Table',
                type: 'table',
                isDefault: true,
                position: 0,
            },
        });

        return NextResponse.json(board);
    } catch (error) {
        console.error('Error creating board:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

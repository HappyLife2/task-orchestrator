import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createBoardSchema = z.object({
    name: z.string().min(1),
    departmentId: z.string().uuid(),
    // Optional columns config could be passed here
});

export async function POST(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, departmentId } = createBoardSchema.parse(body);

        // Verify department belongs to org
        const department = await db.department.findUnique({
            where: { id: departmentId },
        });

        if (!department || department.organizationId !== payload.orgId) {
            return NextResponse.json({ error: 'Invalid department' }, { status: 403 });
        }

        const defaultColumns = [
            { id: 'person', type: 'person', title: 'Person', width: 100 },
            {
                id: 'status', type: 'status', title: 'Status', width: 140, settings: {
                    labels: { 'done': '#00c875', 'working': '#fdab3d', 'stuck': '#e2445c', 'default': '#c4c4c4' }
                }
            },
            { id: 'date', type: 'date', title: 'Date', width: 120 },
        ];

        const board = await db.board.create({
            data: {
                name,
                departmentId,
                columns: JSON.stringify(defaultColumns),
            },
        });

        return NextResponse.json(board, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

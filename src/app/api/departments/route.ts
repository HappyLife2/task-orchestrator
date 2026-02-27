import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createDepartmentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

export async function POST(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'OWNER'].includes(payload.role)) {
        return NextResponse.json({ error: 'Only admins can create departments' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name } = createDepartmentSchema.parse(body);

        if (!payload.orgId) {
            return NextResponse.json({ error: 'No organization found in token' }, { status: 400 });
        }

        const newDepartment = await db.department.create({
            data: {
                name,
                organizationId: payload.orgId
            }
        });

        return NextResponse.json(newDepartment);

    } catch (error) {
        console.error('Failed to create department', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

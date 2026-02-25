import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

export async function PATCH(
    req: NextRequest,
    { params }: { params: { departmentId: string } }
) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admins or owners to rename departments
    if (!['ADMIN', 'OWNER'].includes(payload.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name } = body;

        const department = await db.department.update({
            where: { id: params.departmentId },
            data: {
                name,
            },
        });

        return NextResponse.json(department);
    } catch (error) {
        console.error('Error updating department:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { departmentId: string } }
) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    // Only allow admins or owners to delete departments
    if (!payload || !['ADMIN', 'OWNER'].includes(payload.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await db.department.delete({
            where: { id: params.departmentId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting department:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

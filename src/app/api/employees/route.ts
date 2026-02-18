import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const user = token ? verifyToken(token) : null;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const employees = await db.user.findMany({
            where: { organizationId: user.orgId },
            select: { id: true, name: true, email: true, role: true }
        });
        return NextResponse.json(employees);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

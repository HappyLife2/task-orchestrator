import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userPayload = verifyToken(token);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const users = await db.user.findMany({
            where: {
                organizationId: userPayload.orgId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                position: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

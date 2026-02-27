import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await db.organization.findUnique({
        where: { id: payload.orgId },
        include: {
            users: {
                where: { id: payload.userId },
                select: { name: true }
            },
            departments: {
                include: {
                    boards: {
                        where: ['ADMIN', 'OWNER'].includes(payload.role) ? {} : {
                            members: {
                                some: {
                                    userId: payload.userId
                                }
                            }
                        },
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });

    if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const departments = ['ADMIN', 'OWNER'].includes(payload.role)
        ? org.departments
        : org.departments.filter(d => d.boards.length > 0);

    return NextResponse.json({
        ...org,
        departments,
        currentUserRole: payload.role,
        currentUserName: org.users[0]?.name || 'User'
    });
}

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

    return NextResponse.json({
        ...org,
        currentUserRole: payload.role
    });
}

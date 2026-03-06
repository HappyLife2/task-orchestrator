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
            workspaces: {
                include: {
                    departments: {
                        include: {
                            boards: {
                                where: ['ADMIN', 'OWNER'].includes(String(String(payload.role).toUpperCase()).toUpperCase()) ? {} : {
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
                }
            }
        },
    });

    if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Filter departments inside workspaces based on role
    // @ts-ignore
    const workspaces = org.workspaces.map((ws: any) => {
        const filteredDepartments = ['ADMIN', 'OWNER'].includes(String(String(payload.role).toUpperCase()).toUpperCase())
            ? ws.departments
            : ws.departments.filter((d: any) => d.boards.length > 0);
        return { ...ws, departments: filteredDepartments };
    });

    return NextResponse.json({
        ...(org as any),
        workspaces,
        currentUserRole: payload.role,
        currentUserName: (org as any).users?.[0]?.name || 'User'
    });
}

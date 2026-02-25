import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { boardId: string } }) {
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userPayload = verifyToken(token);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { boardId } = params;

        const members = await db.boardMember.findMany({
            where: { boardId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        position: true,
                    },
                },
            },
        });

        return NextResponse.json({ members });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { boardId: string } }) {
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userPayload = verifyToken(token);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Only ADMINs can add members, OR owners of the board (assume ADMIN for now)
        if (userPayload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden. Admins only.' }, { status: 403 });
        }

        const { boardId } = params;
        const body = await req.json();
        const { userId, role = 'MEMBER' } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const member = await db.boardMember.create({
            data: {
                boardId,
                userId,
                role,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        position: true,
                    },
                },
            },
        });

        return NextResponse.json({ member });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { boardId: string } }) {
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userPayload = verifyToken(token);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (userPayload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden. Admins only.' }, { status: 403 });
        }

        const { boardId } = params;
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        await db.boardMember.delete({
            where: {
                boardId_userId: {
                    boardId,
                    userId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: 'Update ID is required' }, { status: 400 });
        }

        await prisma.update.delete({
            where: { id: id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete update:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Update ID is required' }, { status: 400 });
        }

        if (!body.content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const updatedUpdate = await prisma.update.update({
            where: { id: id },
            data: { content: body.content },
            include: { user: true, replies: { include: { user: true } }, reactions: true }
        });

        return NextResponse.json(updatedUpdate);
    } catch (error) {
        console.error('Failed to update update:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

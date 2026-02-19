import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const reactionSchema = z.object({
    emoji: z.string().emoji().or(z.string().min(1)) // specific Emoji validation or at least non-empty string
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { emoji } = reactionSchema.parse(body);
        const updateId = params.id;
        const userId = payload.userId;

        // Check if user already reacted
        const existingReaction = await db.updateReaction.findUnique({
            where: {
                updateId_userId: {
                    updateId,
                    userId
                }
            }
        });

        if (existingReaction) {
            if (existingReaction.emoji === emoji) {
                // If same emoji, remove it (toggle off)
                await db.updateReaction.delete({
                    where: { id: existingReaction.id }
                });
                return NextResponse.json({ status: 'removed', emoji });
            } else {
                // If different emoji, update it
                const updated = await db.updateReaction.update({
                    where: { id: existingReaction.id },
                    data: { emoji }
                });
                return NextResponse.json({ status: 'updated', reaction: updated });
            }
        } else {
            // Create new reaction
            const newReaction = await db.updateReaction.create({
                data: {
                    updateId,
                    userId,
                    emoji
                }
            });
            return NextResponse.json({ status: 'created', reaction: newReaction }, { status: 201 });
        }

    } catch (error) {
        console.error('Failed to toggle reaction:', error);
        return NextResponse.json({ error: 'Failed to process reaction' }, { status: 500 });
    }
}

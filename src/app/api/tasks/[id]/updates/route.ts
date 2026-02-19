/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createUpdateSchema = z.object({
    content: z.string().min(1),
    parentId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;
    const currentUserId = payload.userId;

    try {
        const updates = await db.update.findMany({
            where: { taskId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatarUrl: true, role: true }
                },
                replies: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                reactions: {
                    select: {
                        emoji: true,
                        userId: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        const topLevelUpdates = updates
            .filter((u: any) => !u.parentId)
            .map((u: any) => {
                // Group reactions by emoji
                const reactionCounts: Record<string, number> = {};
                let userReaction: string | null = null;

                u.reactions.forEach((r: any) => {
                    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
                    if (r.userId === currentUserId) {
                        userReaction = r.emoji;
                    }
                });

                const formattedReactions = Object.entries(reactionCounts).map(([emoji, count]) => ({
                    emoji,
                    count,
                    reactedByMe: userReaction === emoji // Only true if THIS specific emoji matches user's reaction
                }));

                return {
                    ...u,
                    reactions: formattedReactions,
                    myReaction: userReaction
                };
            });

        return NextResponse.json(topLevelUpdates);
    } catch (error) {
        console.error('Failed to fetch updates:', error);
        return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
    }
}


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { content, parentId } = createUpdateSchema.parse(body);
        const taskId = params.id;

        const update = await db.update.create({
            data: {
                content,
                taskId,
                userId: payload.userId,
                parentId
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(update, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create update' }, { status: 500 });
    }
}

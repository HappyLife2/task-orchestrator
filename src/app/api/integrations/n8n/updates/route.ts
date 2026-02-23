import { NextRequest, NextResponse } from 'next/server';
import { db, hashPassword } from '@/lib/auth';
import { z } from 'zod';

const createUpdateSchema = z.object({
    externalId: z.string(),
    authorEmail: z.string().email(),
    content: z.string().min(1),
    parentId: z.string().uuid().optional(),
});

export async function GET() {
    return NextResponse.json({
        status: 'online',
        service: 'Automated Updates Feed API',
        description: 'This endpoint is designed for POST requests from automation tools like n8n.',
        authentication: 'Requires x-api-key header',
        documentation: 'See project walkthrough for payload structure'
    });
}

export async function POST(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    // 1. Validate API Key
    const keyRecord = await db.apiKey.findUnique({
        where: { key: apiKey },
        include: { organization: true },
    });

    if (!keyRecord) {
        return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const orgId = keyRecord.organizationId;

    // 2. Parse Body
    let data;
    try {
        const body = await req.json();
        data = createUpdateSchema.parse(body);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Invalid Request Body' }, { status: 400 });
    }

    try {
        // 3. Resolve Task by externalId
        const task = await db.task.findFirst({
            where: {
                externalId: data.externalId,
                board: {
                    department: {
                        organizationId: orgId
                    }
                }
            }
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // 4. Resolve or Create Author
        let user = await db.user.findUnique({
            where: { email: data.authorEmail }
        });

        if (!user) {
            user = await db.user.create({
                data: {
                    email: data.authorEmail,
                    name: data.authorEmail.split('@')[0],
                    password: await hashPassword(Math.random().toString(36)),
                    organizationId: orgId,
                    role: 'MEMBER'
                }
            });
        }

        // Verify user belongs to the same org
        if (user.organizationId !== orgId) {
            return NextResponse.json({ error: 'Author does not belong to this organization' }, { status: 403 });
        }

        // 5. Create Update
        const update = await db.update.create({
            data: {
                content: data.content,
                taskId: task.id,
                userId: user.id,
                parentId: data.parentId
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(update, { status: 201 });

    } catch (error) {
        console.error('Automated Update Error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { db, hashPassword } from '@/lib/auth';
import { z } from 'zod';

const createUpdateSchema = z.object({
    externalId: z.string(),
    authorEmail: z.string().email(),
    content: z.string().min(1),
    parentId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
    const acceptHeader = req.headers.get('accept') || '';
    const isBrowser = acceptHeader.includes('text/html') && !acceptHeader.includes('application/json');

    if (isBrowser) {
        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
                    <div style="text-align: center; padding: 2rem; border-radius: 12px; background: white; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <h2 style="margin-top: 0;">Automated Updates API</h2>
                        <p style="color: #64748b;">This endpoint requires POST requests with an x-api-key.</p>
                        <a href="/api/n8n" style="display: inline-block; padding: 0.5rem 1rem; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">View Full Documentation Hub</a>
                    </div>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }

    return NextResponse.json({ error: 'This endpoint requires POST requests with an x-api-key.' }, { status: 405 });
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

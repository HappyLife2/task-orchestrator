import { NextRequest, NextResponse } from 'next/server';
import { db, hashPassword, signToken } from '@/lib/auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    orgName: z.string().min(2),
    position: z.string().optional(),
    role: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, name, orgName, position, role } = registerSchema.parse(body);

        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);
        const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

        // Transaction to create org and user
        const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create Org
            const org = await tx.organization.create({
                data: {
                    name: orgName,
                    slug: orgSlug,
                },
            });

            // Create Default Department
            const dept = await tx.department.create({
                data: {
                    name: 'General',
                    organizationId: org.id,
                },
            });

            // Create Default Board
            await tx.board.create({
                data: {
                    name: 'Main Board',
                    departmentId: dept.id,
                    columns: JSON.stringify([
                        { id: 'person', type: 'person', title: 'Person', width: 100 },
                        {
                            id: 'status', type: 'status', title: 'Status', width: 140, settings: {
                                labels: { 'done': '#00c875', 'working': '#fdab3d', 'stuck': '#e2445c', 'default': '#c4c4c4' }
                            }
                        },
                        { id: 'date', type: 'date', title: 'Date', width: 120 },
                    ]),
                },
            });

            // Create User
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: role || 'ADMIN',
                    position: position || null,
                    organizationId: org.id,
                },
            });

            return { user, org };
        });

        const token = signToken({
            userId: result.user.id,
            orgId: result.user.organizationId,
            role: result.user.role,
            position: result.user.position || undefined,
        });

        const response = NextResponse.json({
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role,
                position: result.user.position,
                organizationId: result.user.organizationId,
            },
            token,
        }, { status: 201 });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return response;

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

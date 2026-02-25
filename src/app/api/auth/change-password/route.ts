import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken, comparePassword } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = changePasswordSchema.parse(body);

        // Fetch the user from the database
        const user = await db.user.findUnique({
            where: { id: payload.userId as string },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify the current password
        const isValid = await comparePassword(currentPassword, user.password);

        if (!isValid) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
        }

        // Hash and save the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await db.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
        });

        return NextResponse.json({ success: true, message: 'Password updated successfully' });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error('Change password error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

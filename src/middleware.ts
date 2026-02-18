import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-dev-only';

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // 1. n8n Integration Handling (API Key)
    if (path.startsWith('/api/integrations/n8n')) {
        const apiKey = req.headers.get('x-api-key');
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
        }
        // Note: We cannot query Prisma in Middleware (Edge). 
        // We should either verify key signature (if it was a token) or pass this check to the route handler.
        // Since we need to look up the key in DB, we MUST pass this to the route handler.
        // So for now, we just ensure the header is present or skip this check in middleware and let route handler do it.
        // Let's let the route handler handle DB lookup.
        return NextResponse.next();
    }

    // 2. Auth Routes - Skip
    if (path.startsWith('/api/auth') || path.startsWith('/_next') || path === '/favicon.ico') {
        return NextResponse.next();
    }

    // 3. Protected API Routes
    if (path.startsWith('/api/') || path.startsWith('/dashboard') || path.startsWith('/board')) {
        const tokenCookie = req.cookies.get('token');
        const token = tokenCookie?.value;

        if (!token) {
            if (path.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            } else {
                return NextResponse.redirect(new URL('/login', req.url));
            }
        }

        try {
            const secret = new TextEncoder().encode(JWT_SECRET);
            await jose.jwtVerify(token, secret);
            // Valid token
            return NextResponse.next();
        } catch {
            if (path.startsWith('/api/')) {
                return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
            } else {
                return NextResponse.redirect(new URL('/login', req.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-dev-only';

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // 1. n8n Integration Handling (API Key)
    if (path.startsWith('/api/integrations/n8n') || path.startsWith('/api/n8n')) {
        // Allow GET for status checks/documentation
        if (req.method === 'GET') {
            return NextResponse.next();
        }

        const apiKey = req.headers.get('x-api-key');
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
        }
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

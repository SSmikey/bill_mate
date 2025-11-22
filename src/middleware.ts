import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimiters, addSecurityHeaders } from '@/lib/security';

export default withAuth(
  function middleware(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Apply rate limiting based on the route
    let rateLimiter = RateLimiters.API;
    
    if (req.nextUrl.pathname.includes('/auth') || req.nextUrl.pathname.includes('/login')) {
      rateLimiter = RateLimiters.AUTH;
    } else if (req.nextUrl.pathname.includes('/password')) {
      rateLimiter = RateLimiters.PASSWORD_RESET;
    } else if (req.nextUrl.pathname.includes('/upload')) {
      rateLimiter = RateLimiters.FILE_UPLOAD;
    }
    
    // Check rate limit
    const rateLimitResult = rateLimiter.isAllowed(ip);
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { error: rateLimiter.config.message || 'Too many requests' },
        { status: 429 }
      );
      
      if (rateLimitResult.resetTime) {
        const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
        response.headers.set('Retry-After', retryAfter.toString());
      }
      
      return response;
    }

    // Create response with security headers
    let response = NextResponse.next();
    
    // Add CORS headers for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', process.env.NEXTAUTH_URL || 'http://localhost:3000');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'");
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/tenant/:path*',
    '/api/:path*',
    '/profile'
  ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Protect /dashboard and /dock
  const isProtectedPath = path.startsWith('/dashboard') || path.startsWith('/dock');
  
  if (isProtectedPath) {
    const session = request.cookies.get('lumen-session')?.value;
    
    // For OBS Docks, they might load with a query string like ?w=lumen-123 and we want to allow it
    // if it bypasses login, or we can check if they are logged in.
    // Let's allow access to /dock if the workspace parameter is provided, to make OBS integration seamless.
    const hasWorkspaceParam = request.nextUrl.searchParams.has('w');
    
    if (!session && !(path.startsWith('/dock') && hasWorkspaceParam)) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect to dashboard if logged in and trying to access login page
  if (path === '/') {
    const session = request.cookies.get('lumen-session')?.value;
    if (session) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/dock/:path*'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes à exclure du middleware (login, auth, etc.)
  const excludedRoutes = ['/login', '/auth', '/unauthorized', '/create-password', '/forgot-password', '/reset-password'];
  const isExcludedRoute = excludedRoutes.some(route => pathname.startsWith(route));
  
  if (isExcludedRoute) {
    return NextResponse.next();
  }

  // Routes protégées par rôle
  const protectedRoutes = ['/admin', '/formateur', '/tuteur', '/apprenant'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    // Créer le client Supabase pour le middleware
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Vérifier la session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('🔒 Middleware: User not authenticated, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Récupérer la dernière membership et le rôle
    const { data: membership, error: membershipError } = await supabase
      .from('org_memberships')
      .select('role, organizations!inner(name, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (membershipError || !membership) {
      console.log('🔒 Middleware: No membership found, redirecting to unauthorized');
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    const userRole = membership.role;
    console.log(`🔒 Middleware: User ${user.email} has role ${userRole}`);

    // Vérifier que le rôle correspond à la route
    const roleRouteMap: Record<string, string> = {
      'admin': '/admin',
      'instructor': '/formateur',
      'tutor': '/tuteur',
      'learner': '/apprenant'
    };

    const expectedRoute = roleRouteMap[userRole];
    const currentRoute = `/${pathname.split('/')[1]}`;

    if (expectedRoute && currentRoute !== expectedRoute) {
      console.log(`🔒 Middleware: Role mismatch. Expected ${expectedRoute}, got ${currentRoute}`);
      return NextResponse.redirect(new URL(expectedRoute, request.url));
    }

    // Si le rôle correspond, autoriser l'accès
    return NextResponse.next();

  } catch (error) {
    console.error('🔒 Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/formateur/:path*',
    '/tuteur/:path*',
    '/apprenant/:path*'
  ]
};
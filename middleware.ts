import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware for Supabase Auth session refresh and route protection.
 * Step 2 Acceptance Criterion:
 * "Logged-out users are redirected to login" when visiting protected `(app)` routes.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured = Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith("http") &&
      !supabaseUrl.includes("your-project-id.supabase.co")
  );

  const pathname = request.nextUrl.pathname;
  const isProtectedAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/assistant") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/admin");

  // If Supabase env vars are not yet added, redirect protected routes to /login
  // with a friendly notice so the app never crashes.
  if (!isConfigured) {
    if (isProtectedAppRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("setup", "required");
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users trying to access protected `(app)` routes to `/login`
  if (!user && isProtectedAppRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const askParam = request.nextUrl.searchParams.get("q");
    if (askParam) {
      loginUrl.searchParams.set("q", askParam);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from `/login` or `/signup` to `/dashboard`
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const nextUrl = request.nextUrl.clone();
    const askParam = request.nextUrl.searchParams.get("q");
    if (askParam) {
      nextUrl.pathname = "/assistant";
    } else {
      nextUrl.pathname = "/dashboard";
    }
    return NextResponse.redirect(nextUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};


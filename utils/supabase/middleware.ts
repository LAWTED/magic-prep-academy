import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Check authentication status for protected routes
    const studentRoutes = [
      "/homepage",
      "/awards",
      "/school",
      "/module",
      "/session",
      "/onboarding",
    ];

    // Check if current path is a student route
    const isStudentRoute = studentRoutes.some(
      (route) =>
        request.nextUrl.pathname.startsWith(route) ||
        request.nextUrl.pathname === route
    );

    // Check for protected routes or student routes
    if (isStudentRoute && !user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // For student routes, also check if user has a profile
    if (isStudentRoute && user) {
      const { data: userData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (profileError || !userData) {
        // If user is authenticated but has no profile, redirect to onboarding
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};

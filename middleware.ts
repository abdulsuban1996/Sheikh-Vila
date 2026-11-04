import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const path = request.nextUrl.pathname;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectTo = (to: string, clearSession = false) => {
    const url = request.nextUrl.clone();
    const [pathname, query] = to.split("?");
    url.pathname = pathname;
    url.search = query ? `?${query}` : "";
    const res = NextResponse.redirect(url);
    // keep refreshed/cleared auth cookies on the redirect response
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    if (clearSession) res.headers.set("Clear-Site-Data", '"cache"');
    return res;
  };

  if (path === "/offline") return response;

  if (!user) {
    return path === "/login" ? response : redirectTo("/login");
  }

  // Signed in: the profile must exist and be approved.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return redirectTo("/login?error=not_approved", true);
  }

  if (path === "/login" || path === "/") return redirectTo("/dashboard");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.webmanifest|sw.js|swe-worker.*|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|map)$).*)",
  ],
};

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const error = request.nextUrl.searchParams.get("error");
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = error === "not_approved" ? "?error=not_approved" : "";
  return NextResponse.redirect(url);
}

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    console.log('Exchanging code for session...', code.substring(0, 5) + '...');
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      console.log('Session exchanged successfully. Redirecting to:', `${origin}${next}`);
      console.log('Session User:', data.session?.user?.id);
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Exchange error:', error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

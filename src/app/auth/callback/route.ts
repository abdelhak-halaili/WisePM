import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

import { getURL } from "@/utils/get-url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/dashboard";
  const baseUrl = getURL();

  if (code) {
    const supabase = await createClient();
    console.log('Exchanging code for session...', code.substring(0, 5) + '...');
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      console.log('Session exchanged successfully. Redirecting to:', `${baseUrl}${next}`);
      console.log('Session User:', data.session?.user?.id);
      return NextResponse.redirect(`${baseUrl}${next}`);
    } else {
      console.error('Exchange error:', error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
}

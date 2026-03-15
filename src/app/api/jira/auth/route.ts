
import { NextResponse } from 'next/server';
import { getJiraAuthUrl } from '@/lib/jira';

export async function GET(request: Request) {
  // Use the origin from the request to build the explicit callback URL
  // This handles the difference between localhost, wisepm.org, and www.wisepm.org flawlessly
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/jira/callback`;
  
  const authUrl = getJiraAuthUrl(redirectUri);
  return NextResponse.redirect(authUrl);
}

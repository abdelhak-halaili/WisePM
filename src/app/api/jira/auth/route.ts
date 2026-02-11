
import { NextResponse } from 'next/server';
import { getJiraAuthUrl } from '@/lib/jira';

export async function GET() {
  const authUrl = getJiraAuthUrl();
  return NextResponse.redirect(authUrl);
}

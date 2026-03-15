import { NextResponse } from 'next/server';

export async function GET() {
  const envState = {
    hasClientId: !!process.env.JIRA_CLIENT_ID,
    clientIdLength: process.env.JIRA_CLIENT_ID?.length || 0,
    hasSecret: !!process.env.JIRA_CLIENT_SECRET,
    hasRedirect: !!process.env.JIRA_REDIRECT_URI,
    redirectVal: process.env.JIRA_REDIRECT_URI || "missing"
  };
  
  return NextResponse.json(envState);
}

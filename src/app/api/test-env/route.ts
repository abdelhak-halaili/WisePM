import { NextResponse } from 'next/server';

export async function GET() {
  const envState = {
    hasClientId: !!process.env.JIRA_CLIENT_ID,
    clientIdLength: process.env.JIRA_CLIENT_ID?.length || 0,
    clientIdStart: process.env.JIRA_CLIENT_ID?.substring(0, 3) + "...",
    clientIdEnd: "..." + process.env.JIRA_CLIENT_ID?.substring((process.env.JIRA_CLIENT_ID?.length || 0) - 3),
    hasSecret: !!process.env.JIRA_CLIENT_SECRET,
    secretLength: process.env.JIRA_CLIENT_SECRET?.length || 0,
    hasRedirect: !!process.env.JIRA_REDIRECT_URI,
    redirectVal: process.env.JIRA_REDIRECT_URI || "missing"
  };
  
  return NextResponse.json(envState);
}

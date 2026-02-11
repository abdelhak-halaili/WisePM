
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { exchangeCodeForToken, getCloudId } from '@/lib/jira';
import prisma from '@/utils/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Verify state if implemented

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    // 1. Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code);
    const { access_token, refresh_token, expires_in } = tokenData;

    // 2. Get Cloud ID (Site ID)
    const cloudResource = await getCloudId(access_token);
    const cloudId = cloudResource.id;

    // 3. Get Current User
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: authError }, { status: 401 });
    }

    // 4. Save to Database
    await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: 'jira',
        },
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        cloudId: cloudId,
        expiresAt: Math.floor(Date.now() / 1000) + expires_in,
      },
      create: {
        userId: user.id,
        provider: 'jira',
        accessToken: access_token,
        refreshToken: refresh_token,
        cloudId: cloudId,
        expiresAt: Math.floor(Date.now() / 1000) + expires_in,
      },
    });

    // 5. Redirect back to Dashboard
    return NextResponse.redirect(new URL('/dashboard/settings', request.url));

  } catch (error) {
    console.error('Jira Auth Error:', error);
    return NextResponse.json({ error: 'Failed to authenticate with Jira' }, { status: 500 });
  }
}

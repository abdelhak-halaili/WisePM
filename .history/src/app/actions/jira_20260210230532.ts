
'use server';

import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma';
import { getJiraProjects, getJiraIssueTypes, createJiraIssue, refreshAccessToken } from '@/lib/jira';
import { revalidatePath } from 'next/cache';

async function getJiraIntegration(userId: string) {
  return prisma.integration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: 'jira',
      },
    },
  });
}

import { Integration } from '@prisma/client';

async function ensureValidToken(integration: Integration) {
  const needsRefresh = integration.expiresAt && (Date.now() / 1000) > (integration.expiresAt - 60); // Refresh if exp is within 60s
  
  if (needsRefresh && integration.refreshToken) {
    console.log('Refreshing Jira Access Token...');
    try {
      const tokens = await refreshAccessToken(integration.refreshToken);
      const { access_token, refresh_token, expires_in } = tokens;
      
      const updated = await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token || integration.refreshToken, // Sometimes refresh token doesn't rotate
          expiresAt: Math.floor(Date.now() / 1000) + expires_in,
        },
      });
      return updated;
    } catch (e) {
      console.error('Failed to refresh token', e);
      throw new Error('Jira session expired. Please reconnect.');
    }
  }
  return integration;
}

export async function getJiraIntegrationStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const integration = await getJiraIntegration(user.id);
  if (!integration) return null;

  return {
    isConnected: true,
    cloudId: integration.cloudId,
  };
}

export async function listJiraProjects() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let integration = await getJiraIntegration(user.id);
  if (!integration) throw new Error('Jira not connected');

  integration = await ensureValidToken(integration!);

  return await getJiraProjects(integration.accessToken, integration.cloudId!);
}

export async function listJiraIssueTypes(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let integration = await getJiraIntegration(user.id);
  if (!integration) throw new Error('Jira not connected');

  integration = await ensureValidToken(integration!);

  return await getJiraIssueTypes(integration.accessToken, integration.cloudId!, projectId);
}

export async function createIssueInJira(ticketData: any, jiraProjectId: string, jiraIssueTypeId: string, additionalFields: Record<string, any> = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let integration = await getJiraIntegration(user.id);
  if (!integration) throw new Error('Jira not connected');

  integration = await ensureValidToken(integration!);

  // Construct Jira Issue Payload
  // Note: ADF (Atlassian Document Format) is complex. 
  // For simplicity, we'll try to use the 'description' field with valid ADF or just plain string if supported (Jira usually enforces ADF for description).
  // A simple ADF paragraph:

  // Clean content from base64 images
  let rawContent = (ticketData.coreContent || ticketData.content || ticketData.description || "No content");
  
  // Replace base64 images with placeholder to avoid payload size limits
  // 1. Match markdown images with data URIs: ![...](data:...)
  // 2. Match raw data URIs if present: data:image/...
  rawContent = rawContent.replace(/!\[.*?\]\(data:.*?\)/g, '📷 [Image Omitted - View in WisePM]');
  rawContent = rawContent.replace(/data:image\/[^;]+;base64,[^\s"']+/g, '[Base64 Image Data Omitted]');

  // Truncate content if it's still too long (Jira limit is ~32k chars for description in some contexts, but payload is 1MB)
  // We'll be safe and truncate to 30,000 characters.
  if (rawContent.length > 30000) {
      rawContent = rawContent.substring(0, 30000) + "\n\n... [Content Truncated due to size limits] ...";
  }

  // Split content by paragraphs to be safer with ADF
  const descriptionContent = rawContent
    .split('\n')
    .filter((line: string) => line.trim().length > 0)
    .map((line: string) => ({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: line
        }
      ]
    }));

  const adfDescription = {
    type: "doc",
    version: 1,
    content: descriptionContent
  };

  const payload = {
    fields: {
      project: {
        id: jiraProjectId
      },
      summary: ticketData.title,
      description: adfDescription,
      issuetype: {
        id: jiraIssueTypeId
      },
      ...additionalFields
    }
  };

  console.log('Sending Jira Payload:', JSON.stringify(payload, null, 2));

  try {
    const result = await createJiraIssue(integration.accessToken, integration.cloudId!, payload);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error creating Jira issue:", error);
    // Try to parse the error message if it's a JSON string in the error
    let errorMessage = error.message;
    try {
        // jiraRequest throws "Jira API request failed: 400 ..." but also logs the body.
        // We might want to pass the validation errors more cleanly.
        // For now, let's just return the message which hopefully contains some info, 
        // or we can modify jiraRequest to throw a more structured error.
        
        // If we want more details, we should update lib/jira.ts to throw the object.
        // But for now, returning the message is better than crashing.
    } catch (e) {}
    
    return { success: false, error: errorMessage };
  }
}

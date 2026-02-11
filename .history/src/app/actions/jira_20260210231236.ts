
'use server';

import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma';
import { getJiraProjects, getJiraIssueTypes, createJiraIssue, refreshAccessToken, uploadJiraAttachment } from '@/lib/jira';
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
  
  // Extract images to upload as attachments
  const imagesToUpload: { filename: string, data: string }[] = [];
  
  // 1. Markdown images: ![Alt Text](data:image/png;base64,...)
  // We use a replacer function to extract data and replace text simultaneously
  rawContent = rawContent.replace(/!\[(.*?)\]\((data:image\/[^;]+;base64,[^\)]+)\)/g, (match, alt, dataUri) => {
      const filename = (alt || 'Screenshot').replace(/[^a-zA-Z0-9-_]/g, '_') + '.png'; // Sanitize filename
      imagesToUpload.push({ filename, data: dataUri });
      return `\n> 📎 **[Attachment: ${filename}]** (See Attachments section below)\n`;
  });

  // 2. Raw data URIs (fallback): data:image/...
  // These are harder to name contextually, so we just index them
  let rawImageIndex = 1;
  rawContent = rawContent.replace(/(data:image\/[^;]+;base64,[^\s"'\)]+)/g, (match) => {
      // Avoid re-matching what we just replaced if regex overlaps (unlikely with specific groups but good to be safe)
      // Actually simpler regex for raw data might catch what's inside () of markdown if we aren't careful.
      // But since we replaced the markdown ones first, they are gone.
      const filename = `Image_${rawImageIndex++}.png`;
      imagesToUpload.push({ filename, data: match });
      return `[Attachment: ${filename}]`;
  });

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
    
    // Upload attachments if any
    if (result.key && imagesToUpload.length > 0) {
        console.log(`Uploading ${imagesToUpload.length} attachments for issue ${result.key}...`);
        
        // We need to do this in parallel or serial. Serial is safer for order.
        for (const img of imagesToUpload) {
            try {
                // Convert base64 to Blob/Buffer
                // format is "data:image/png;base64,....."
                const base64Data = img.data.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                
                // Create FormData
                const formData = new FormData();
                // In Node environment with 'undici' (used by Next.js fetch), we need to append Blob or File.
                // Buffer alone might not work directly with standard FormData polyfills without a blob/file interface.
                // However, updated Node often handles it. Let's try passing the buffer with filename options if possible,
                // or just standard Blob construction.
                const blob = new Blob([buffer], { type: 'image/png' });
                formData.append('file', blob, img.filename);

                await uploadJiraAttachment(integration.accessToken, integration.cloudId!, result.key, formData);
                console.log(`Uploaded ${img.filename}`);
            } catch (attError) {
                console.error(`Failed to upload attachment ${img.filename}`, attError);
                // Don't fail the main request, just log it.
            }
        }
    }

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

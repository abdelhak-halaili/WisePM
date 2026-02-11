

const JIRA_CLIENT_ID = process.env.JIRA_CLIENT_ID!;
const JIRA_CLIENT_SECRET = process.env.JIRA_CLIENT_SECRET!;
const JIRA_REDIRECT_URI = process.env.JIRA_REDIRECT_URI!;
const JIRA_CLOUD_ID_API = process.env.JIRA_CLOUD_ID_API || 'https://api.atlassian.com/oauth/token/accessible-resources';

// Scopes: read:jira-work write:jira-work read:jira-user offline_access
const SCOPES = 'read:jira-work write:jira-work read:jira-user offline_access';

export const getJiraAuthUrl = () => {
  const params = new URLSearchParams({
    audience: 'api.atlassian.com',
    client_id: JIRA_CLIENT_ID,
    scope: SCOPES,
    redirect_uri: JIRA_REDIRECT_URI,
    state: 'random_state_string', // In production, use a secure random string and verify it
    response_type: 'code',
    prompt: 'consent',
  });
  
  return `https://auth.atlassian.com/authorize?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string) => {
  const response = await fetch('https://auth.atlassian.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: JIRA_CLIENT_ID,
      client_secret: JIRA_CLIENT_SECRET,
      code: code,
      redirect_uri: JIRA_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
};

export const getCloudId = async (accessToken: string) => {
  const response = await fetch(JIRA_CLOUD_ID_API, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch accessible resources (Cloud ID)');
  }

  const data = await response.json();
  // Assuming the user picks the first available site or we just pick the first one
  // In a real app, you might ask the user to select which site to use if they have multiple
  if (data.length === 0) {
    throw new Error('No Jira Cloud sites found for this user.');
  }

  return data[0]; // Returns { id: "cloud-id", name: "site-name", ... }
};

export const refreshAccessToken = async (refreshToken: string) => {
  const response = await fetch('https://auth.atlassian.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: JIRA_CLIENT_ID,
      client_secret: JIRA_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  return response.json();
};

/**
 * Jira API Helpers
 */

async function jiraRequest(endpoint: string, accessToken: string, cloudId: string, options: RequestInit = {}) {
  const url = `https://api.atlassian.com/ex/jira/${cloudId}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Jira API Error [${endpoint}]:`, errorBody);
    throw new Error(`Jira API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const getJiraProjects = async (accessToken: string, cloudId: string) => {
  return jiraRequest('/rest/api/3/project', accessToken, cloudId);
};

export const getJiraIssueTypes = async (accessToken: string, cloudId: string, projectId?: string) => {
  if (projectId) {
     const data = await jiraRequest(`/rest/api/3/issue/createmeta?projectIds=${projectId}`, accessToken, cloudId);
     if (data.projects && data.projects.length > 0) {
       return data.projects[0].issuetypes;
     }
     return [];
  }
  return jiraRequest('/rest/api/3/issuetype', accessToken, cloudId);
};

export const createJiraIssue = async (accessToken: string, cloudId: string, issueData: any) => {
  return jiraRequest('/rest/api/3/issue', accessToken, cloudId, {
    method: 'POST',
    body: JSON.stringify(issueData),
  });
};

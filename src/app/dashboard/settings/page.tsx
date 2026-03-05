
import { getJiraIntegrationStatus, disconnectJiraAction } from '@/app/actions/jira';
import Link from 'next/link';

export default async function SettingsPage() {
  const status = await getJiraIntegrationStatus();
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Settings</h1>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
        <h2>Integrations</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
          <div>
            <h3>Jira</h3>
            <p style={{ color: '#666' }}>Connect to Jira Software to export tickets directly.</p>
            {status?.isConnected && (
              <p style={{ color: 'green', marginTop: '0.5rem' }}>✅ Connected (Cloud ID: {status.cloudId})</p>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            {status?.isConnected ? (
              <form action={disconnectJiraAction}>
                <button type="submit" style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}>
                  Disconnect Jira
                </button>
              </form>
            ) : (
              <Link href="/api/jira/auth" prefetch={false}>
                <button style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0052CC',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}>
                  Connect Jira
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

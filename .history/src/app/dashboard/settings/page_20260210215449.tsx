
import { getJiraIntegrationStatus } from '@/app/actions/jira';
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
          
          <Link href="/api/jira/auth" prefetch={false}>
            <button style={{
              padding: '0.5rem 1rem',
              backgroundColor: status?.isConnected ? '#f0f0f0' : '#0052CC',
              color: status?.isConnected ? '#333' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500
            }}>
              {status?.isConnected ? 'Reconnect Jira' : 'Connect Jira'}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

import '../styles/Profile.css';

export default function Profile({ walletAddress, onNavigate }) {
  return (
    <div className="page-container">
      <div className="section-card">
        <div className="section-header">
          <span className="section-title">My Profile</span>
          <span className="section-badge">Verified Member</span>
        </div>

        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'var(--surface-hover)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', border: '1px solid var(--border)'
            }}>
              {walletAddress ? '🦊' : '👤'}
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>Welcome</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: '14px' }}>
                {walletAddress || 'Wallet not connected'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>
              Go to Dashboard
            </button>
            <button className="btn btn-outline" onClick={() => onNavigate('files')}>
              View My Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Bell } from 'lucide-react';

export default function Topbar({ walletAddress, title, theme, toggleTheme, notifications = 3 }) {
  const short = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  return (
    <header className="navbar">
      <div style={{ marginRight: 'auto', fontWeight: 600, fontSize: '15px' }}>
        {title}
      </div>
      <button 
        onClick={toggleTheme} 
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '5px 11px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)', marginRight: '16px' }}
        title="Toggle Theme"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <div style={{ position: 'relative', marginRight: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <Bell size={20} color="var(--text-primary)" />
        {notifications > 0 && (
          <span style={{
            position: 'absolute',
            top: '-6px',
            right: '-8px',
            background: '#FF4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {notifications}
          </span>
        )}
      </div>
      <div className="wallet-chip">
        <span style={{ color: 'var(--accent-teal)', fontSize: 9 }}>●</span>
        {short}
      </div>
    </header>
  );
}
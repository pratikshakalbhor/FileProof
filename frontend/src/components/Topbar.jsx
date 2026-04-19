export default function Topbar({ walletAddress, title, theme, toggleTheme }) {
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
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '5px 11px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}
        title="Toggle Theme"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <div className="sim-badge">
        <span className="dot" />
        Simulated Blockchain Mode
      </div>
      <div className="wallet-chip">
        <span style={{ color: 'var(--accent-teal)', fontSize: 9 }}>●</span>
        {short}
      </div>
    </header>
  );
}
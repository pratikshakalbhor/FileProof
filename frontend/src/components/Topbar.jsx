import { useState, useRef, useEffect, useCallback } from 'react';

const API = 'http://localhost:5000/api';



export default function Topbar({ pageTitle, walletAddress, onDisconnect }) {
  const [open,    setOpen]    = useState(false);
  const [notifs,  setNotifs]  = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const [theme,   setTheme]   = useState(localStorage.getItem('theme') || 'dark');
  const panelRef = useRef(null);
  const btnRef   = useRef(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  // ── Fetch notifications from API ──
  const fetchNotifs = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/notifications?wallet=${walletAddress}`);
      const data = await res.json();
      if (data.success) {
        setNotifs(data.notifications || []);
        setUnread(data.unread || 0);
      }
    } catch (err) {
      console.error('Notifications fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Fetch on mount + every 30 seconds
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // Mark all read when dropdown opens
  const handleBellClick = async () => {
    setOpen(o => !o);
    if (!open && unread > 0 && walletAddress) {
      try {
        await fetch(`${API}/notifications/read?wallet=${walletAddress}`, { method: 'PUT' });
        setUnread(0);
        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
        console.error('Mark read error:', err);
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current   && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <header style={{
      height: '64px',
      width: '100%',
      backgroundColor: 'var(--bg-sidebar)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      boxSizing: 'border-box',
      borderBottom: '1px solid var(--border)'
    }}>
      {/* Left — title */}
      <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>
        {pageTitle || 'Dashboard'}
      </div>

      {/* Right — controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
        >
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>

        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button ref={btnRef} onClick={handleBellClick}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                background: '#EF4444', color: '#fff',
                width: 14, height: 14, borderRadius: '50%',
                fontSize: '8px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {open && (
            <div ref={panelRef} style={{
              position: 'absolute', top: '48px', right: 0,
              width: '300px', borderRadius: '8px',
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden', zIndex: 1100,
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
                <button onClick={fetchNotifs} style={{ fontSize: '12px', color: 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer' }}>Refresh</button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>Loading...</div>
                ) : notifs.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No notifications</div>
                ) : notifs.map((n, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', backgroundColor: n.read ? 'transparent' : 'var(--bg-active)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{n.message}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatTime(n.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wallet Badge */}
        <div 
          onClick={onDisconnect}
          title="Disconnect Wallet"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '6px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-teal)' }}></div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            {shortAddr}
          </span>
        </div>

      </div>
    </header>
  );
}
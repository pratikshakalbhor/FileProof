import { useState, useRef, useEffect } from 'react';
import '../styles/Topbar.css';

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const INITIAL_NOTIFS = [
  { id: 1, type: 'success', title: 'File sealed', msg: 'resume.pdf sealed on Ethereum.', time: '2m ago', read: false },
  { id: 2, type: 'warning', title: 'Tamper detected', msg: 'contract.docx hash mismatch found.', time: '18m ago', read: false },
  { id: 3, type: 'info', title: 'File shared', msg: 'nft1.png shared with 0x5c38...02b4.', time: '1h ago', read: false },
  { id: 4, type: 'success', title: 'Verify passed', msg: 'bank_statement.pdf integrity confirmed.', time: '3h ago', read: true },
];

const DOT_COLOR = { success: '#639922', warning: '#E24B4A', info: '#378ADD' };

export default function Topbar({ pageTitle, walletAddress, onDisconnect }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);
  const [hovAvatar, setHovAvatar] = useState(false);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => setNotifs(p => p.map(n => ({ ...n, read: true })));
  const dismissOne = (id) => setNotifs(p => p.filter(n => n.id !== id));

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 60,
      borderBottom: '0.5px solid rgba(255,255,255,0.1)',
      background: 'var(--bg, #0f0f0f)',
      position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
    }}>

      {/* ── Left ── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary, #fff)', lineHeight: 1.2 }}>
          {pageTitle}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted, #888)', marginTop: 2 }}>
          CryptoVault / {pageTitle}
        </span>
      </div>

      {/* ── Right ── */}
      <div style={{
        display: 'flex', flexDirection: 'row',
        alignItems: 'center', gap: 12,
      }}>

        {/* Bell */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button ref={btnRef} onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}
            style={{
              position: 'relative', width: 36, height: 36,
              borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: 'var(--text-primary,#fff)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <BellIcon />
            {unread > 0 && (
              <span className="notif-badge-count">{unread}</span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div ref={panelRef} style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 300, borderRadius: 12,
              background: 'var(--surface, #1a1a1a)',
              border: '0.5px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              overflow: 'hidden', zIndex: 999,
            }}>
              {/* Head */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 16px',
                borderBottom: '0.5px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary,#fff)' }}>
                  Notifications
                </span>
                <button onClick={markAllRead} style={{
                  fontSize: 11, color: '#378ADD', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0,
                }}>Mark all read</button>
              </div>

              {/* List */}
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '32px 16px', fontSize: 13, color: 'var(--text-muted,#888)', gap: 8,
                  }}>
                    <BellIcon />
                    <p style={{ margin: 0 }}>No notifications</p>
                  </div>
                ) : notifs.map(n => (
                  <div key={n.id} style={{
                    display: 'flex', flexDirection: 'row',
                    alignItems: 'flex-start', gap: 10,
                    padding: '11px 16px',
                    borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                    background: n.read ? 'transparent' : 'rgba(55,138,221,0.05)',
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      marginTop: 5, background: DOT_COLOR[n.type] ?? '#888',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary,#fff)', marginBottom: 2 }}>
                        {n.title}
                      </div>
                      <div style={{
                        fontSize: 11, color: 'var(--text-muted,#888)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{n.msg}</div>
                      <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{n.time}</div>
                    </div>
                    <button onClick={() => dismissOne(n.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#666', padding: 2, flexShrink: 0,
                      display: 'flex', alignItems: 'center',
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {notifs.length > 0 && (
                <div style={{
                  padding: '10px 16px', textAlign: 'center',
                  borderTop: '0.5px solid rgba(255,255,255,0.08)',
                }}>
                  <button onClick={() => setNotifs([])} style={{
                    fontSize: 12, color: '#888', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0,
                  }}>Clear all</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wallet badge */}
        <div style={{
          display: 'flex', flexDirection: 'row', alignItems: 'center',
          gap: 6, padding: '6px 12px', borderRadius: 20, flexShrink: 0,
          border: '0.5px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.05)',
          fontSize: 12, color: 'var(--text-primary,#fff)', whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#639922', flexShrink: 0 }} />
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          {shortAddress}
        </div>

        {/* Avatar */}
        <div
          style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
          onClick={onDisconnect}
          onMouseEnter={() => setHovAvatar(true)}
          onMouseLeave={() => setHovAvatar(false)}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#378ADD', color: '#E6F1FB',
            fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '0.5px solid rgba(55,138,221,0.4)',
          }}>
            {walletAddress ? walletAddress.substring(2, 4).toUpperCase() : 'CV'}
          </div>
          {hovAvatar && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.12)',
              borderRadius: 6, padding: '5px 10px',
              fontSize: 11, color: '#aaa', whiteSpace: 'nowrap', zIndex: 10,
            }}>
              Disconnect Wallet
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

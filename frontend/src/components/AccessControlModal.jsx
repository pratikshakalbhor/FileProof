import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateVisibility } from '../utils/api';

const VISIBILITY_OPTIONS = [
  {
    key: 'private',
    label: 'Private',
    desc: 'Only you can view and verify this file',
    color: '#7F77DD',
    bg: 'rgba(127,119,221,0.08)',
    border: 'rgba(127,119,221,0.3)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    key: 'public',
    label: 'Public',
    desc: 'Anyone with the File ID can verify without login',
    color: 'var(--green)',
    bg: 'rgba(0,255,157,0.08)',
    border: 'rgba(0,255,157,0.3)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    key: 'shared',
    label: 'Shared',
    desc: 'Only specific wallet addresses can access',
    color: 'var(--accent)',
    bg: 'rgba(0,212,255,0.08)',
    border: 'rgba(0,212,255,0.3)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

export default function AccessControlModal({ file, onClose, onSuccess }) {
  const [visibility, setVisibility] = useState(file.visibility || 'private');
  const [wallets, setWallets]       = useState(file.sharedWith || []);
  const [newWallet, setNewWallet]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [saved, setSaved]           = useState(false);

  const isValidWallet = (w) => /^0x[0-9a-fA-F]{40}$/.test(w);

  const addWallet = () => {
    if (!isValidWallet(newWallet)) {
      setError('Valid Ethereum address ghala (0x... 42 chars)');
      return;
    }
    if (wallets.includes(newWallet)) {
      setError('He address already add aahe');
      return;
    }
    setWallets(prev => [...prev, newWallet]);
    setNewWallet('');
    setError('');
  };

  const removeWallet = (w) => {
    setWallets(prev => prev.filter(x => x !== w));
  };

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      await updateVisibility(
        file.fileId,
        visibility,
        visibility === 'shared' ? wallets : []
      );
      setSaved(true);
      setTimeout(() => {
        onSuccess?.(`${file.filename} — visibility updated to ${visibility}`);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16, width: '100%', maxWidth: 480,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              Access Control
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {file.filename}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--muted)',
            cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>

          {/* Visibility Options */}
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--muted)',
            textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10,
          }}>
            Visibility
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {VISIBILITY_OPTIONS.map(opt => (
              <motion.div
                key={opt.key}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setVisibility(opt.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                  border: visibility === opt.key
                    ? `2px solid ${opt.color}`
                    : '1px solid var(--border)',
                  background: visibility === opt.key ? opt.bg : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: opt.bg, border: `1px solid ${opt.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: opt.color,
                }}>
                  {opt.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: visibility === opt.key ? opt.color : 'var(--text)',
                  }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {opt.desc}
                  </div>
                </div>
                {/* Radio dot */}
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${visibility === opt.key ? opt.color : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {visibility === opt.key && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: opt.color,
                    }}/>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Shared With — wallet list */}
          <AnimatePresence>
            {visibility === 'shared' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: 16 }}
              >
                <div style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8,
                }}>
                  Allowed Wallets
                </div>

                {/* Add wallet input */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    value={newWallet}
                    onChange={e => { setNewWallet(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && addWallet()}
                    placeholder="0x... wallet address"
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8,
                      border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
                      background: 'transparent',
                      color: 'var(--text)', fontSize: 12,
                      fontFamily: 'var(--font-mono)', outline: 'none',
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={addWallet}
                    className="btn btn-outline sm">
                    Add
                  </motion.button>
                </div>

                {error && (
                  <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 8 }}>
                    {error}
                  </div>
                )}

                {/* Wallet list */}
                {wallets.length === 0 ? (
                  <div style={{
                    padding: '12px', borderRadius: 8, textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed var(--border)',
                    fontSize: 12, color: 'var(--muted)',
                  }}>
                    No wallets added — add at least one
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {wallets.map((w, i) => (
                      <motion.div
                        key={w}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: 8,
                          background: 'rgba(0,212,255,0.05)',
                          border: '1px solid rgba(0,212,255,0.15)',
                        }}
                      >
                        <span style={{
                          fontSize: 11, fontFamily: 'var(--font-mono)',
                          color: 'var(--accent)',
                        }}>
                          {w.slice(0, 14)}...{w.slice(-8)}
                        </span>
                        <button
                          onClick={() => removeWallet(w)}
                          style={{
                            background: 'none', border: 'none',
                            cursor: 'pointer', color: 'var(--muted)',
                            fontSize: 14, padding: '0 4px',
                            display: 'flex', alignItems: 'center',
                          }}>
                          ✕
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Public warning */}
          {visibility === 'public' && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(239,159,39,0.08)',
                border: '1px solid rgba(239,159,39,0.25)',
                fontSize: 12, color: '#EF9F27',
              }}>
              Anyone with your File ID can verify this file on the public page without login.
            </motion.div>
          )}

          {/* Error */}
          {error && visibility !== 'shared' && (
            <div style={{
              fontSize: 12, color: 'var(--red)',
              marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={loading || saved ||
                (visibility === 'shared' && wallets.length === 0)}
              className="btn btn-primary"
              style={{ flex: 1 }}>
              {saved ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ marginRight: 6, verticalAlign: 'middle' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Saved!
                </>
              ) : loading ? 'Saving...' : 'Save Access Control'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={onClose}
              className="btn btn-outline"
              style={{ flex: 1 }}>
              Cancel
            </motion.button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import '../styles/Dashboard.css';
import { pageVariants, cardVariants, fadeIn } from '../utils/animations';
import { getAllFiles, getStats } from '../utils/api';

export default function Dashboard({ onNavigate, walletAddress }) {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, tampered: 0, revoked: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storageData, setStorageData] = useState({ used: 0, total: 10240, count: 0 });
  const [qvLoading, setQvLoading] = useState(false);
  const [qvResult, setQvResult]   = useState(null);

  const handleQuickVerify = async () => {
    const id = document.getElementById('qv-input')?.value?.trim();
    if (!id) return;
    setQvLoading(true);
    setQvResult(null);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/files/${id}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error('not found');
      setQvResult({ found: true, file: data.file });
    } catch {
      setQvResult({ found: false });
    } finally {
      setQvLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [filesRes, statsRes] = await Promise.all([
        getAllFiles(walletAddress),
        getStats(),
      ]);
      setFiles(filesRes.files || []);
      setStats(statsRes.stats || { total: 0, valid: 0, tampered: 0, revoked: 0 });

      // Storage calculate karo
      const totalBytes = (filesRes.files || []).reduce((sum, f) => sum + (f.fileSize || 0), 0);
      const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
      setStorageData({
        used: parseFloat(usedMB),
        total: 10240, // 10 GB limit
        count: (filesRes.files || []).length,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) fetchData();
  }, [fetchData, walletAddress]);

  // ── Integrity Score calculate karto ──
  const integrityScore = stats.total === 0
    ? 100
    : Math.round((stats.valid / stats.total) * 100);

  const scoreColor = integrityScore === 100 ? 'var(--green)'
    : integrityScore >= 80 ? 'var(--accent)'
      : integrityScore >= 50 ? 'var(--yellow)'
        : 'var(--red)';

  const scoreLabel = integrityScore === 100 ? 'Perfect'
    : integrityScore >= 80 ? 'Good'
      : integrityScore >= 50 ? 'Warning'
        : 'Critical';

  const formatSize = (b) => {
    if (!b) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card blue">
              <div className="skeleton skeleton-row short" style={{ height: 12, marginBottom: 12 }} />
              <div className="skeleton skeleton-row medium" style={{ height: 32, marginBottom: 8 }} />
              <div className="skeleton skeleton-row short" style={{ height: 10 }} />
            </div>
          ))}
        </div>
        <div className="section-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ marginBottom: 12, display:'flex', justifyContent:'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 13 }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">

      {/* Error */}
      {error && (
        <motion.div variants={fadeIn} initial="initial" animate="animate"
          style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--red)', fontSize: 13 }}>Backend Connection Error</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{error}</div>
          </div>
          <button className="btn btn-outline sm" onClick={fetchData}>↺ Retry</button>
        </motion.div>
      )}

      {/* Stats + Integrity Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 16 }}>

        {/* Stats Cards */}
        {[
          { label: 'Total Files', value: stats.total, sub: 'Uploaded files', color: 'var(--accent)', cls: 'blue' },
          { label: 'Valid', value: stats.valid, sub: 'Integrity intact', color: 'var(--green)', cls: 'green' },
          { label: 'Tampered', value: stats.tampered, sub: 'Action needed', color: 'var(--red)', cls: 'red' },
          { label: 'Revoked', value: stats.revoked, sub: 'Revoked files', color: '#a78bfa', cls: 'purple' },
        ].map((s, i) => (
          <motion.div key={i} className={`stat-card ${s.cls}`} variants={cardVariants}
            initial="initial" animate="animate"
            whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,212,255,0.1)' }}>
            <div className="stat-label">{s.label}</div>
            <motion.div className="stat-value" style={{ color: s.color }}
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 + 0.2 }}>
              {s.value}
            </motion.div>
            <div className="stat-sub">{s.sub}</div>
          </motion.div>
        ))}

        {/* Integrity Score Card */}
        <motion.div className="stat-card green" variants={cardVariants}
          initial="initial" animate="animate"
          whileHover={{ y: -4, boxShadow: `0 12px 32px ${scoreColor}22` }}
          style={{ borderColor: `${scoreColor}44` }}>
          <div className="stat-label">Integrity Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
            {/* Score Circle */}
            <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="var(--border)" strokeWidth="4" />
                <motion.circle cx="28" cy="28" r="22" fill="none"
                  stroke={scoreColor} strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - integrityScore / 100) }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  transform="rotate(-90 28 28)"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: scoreColor }}>
                {integrityScore}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor }}>{scoreLabel}</div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                {stats.valid}/{stats.total} files valid
              </div>
            </div>
          </div>
          <div className="stat-sub">File integrity score</div>
        </motion.div>

      </div>

      {/* Quick Actions */}
      <motion.div className="quick-actions" variants={fadeIn} initial="initial" animate="animate">
        {[
          {
            label: <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Upload &amp; Seal</>,
            page: 'upload', primary: true
          },
          {
            label: <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>Verify File</>,
            page: 'verify', primary: false
          },
          {
            label: <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><rect x="2" y="7" width="6" height="6" rx="1"/><rect x="9" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><line x1="8" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="16" y2="10"/></svg>Blockchain Log</>,
            page: 'blockchain', primary: false
          },
        ].map((btn, i) => (
          <motion.button key={i}
            className={`btn ${btn.primary ? 'btn-primary' : 'btn-outline'}`}
            whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate(btn.page)}>
            {btn.label}
          </motion.button>
        ))}
        <motion.button className="btn btn-outline" whileHover={{ y: -2 }} onClick={fetchData}>
          ↺ Refresh
        </motion.button>
      </motion.div>

      {/* ── Storage Usage ── */}
      <motion.div className="section-card" variants={cardVariants}
        initial="initial" animate="animate"
        style={{ marginBottom: 16 }}>

        <div className="files-header" style={{ marginBottom: 16 }}>
          <span className="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"
              strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: 'middle' }}>
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
            Storage Usage
          </span>
          <span style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: 'var(--muted)',
          }}>
            {storageData.count} files sealed
          </span>
        </div>

        {/* Usage bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 12, marginBottom: 8,
          }}>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>
              {storageData.used} MB used
            </span>
            <span style={{ color: 'var(--muted)' }}>
              {storageData.total} MB total
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            height: 8, background: 'rgba(255,255,255,0.07)',
            borderRadius: 20, overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((storageData.used / storageData.total) * 100, 100).toFixed(1)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                height: '100%', borderRadius: 20,
                background: storageData.used / storageData.total > 0.8
                  ? 'var(--red)'
                  : storageData.used / storageData.total > 0.5
                  ? '#EF9F27'
                  : 'var(--accent)',
              }}
            />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 10, color: 'var(--muted)', marginTop: 6,
            fontFamily: 'var(--font-mono)',
          }}>
            <span>
              {((storageData.used / storageData.total) * 100).toFixed(1)}% used
            </span>
            <span>
              {(storageData.total - storageData.used).toFixed(2)} MB free
            </span>
          </div>
        </div>

        {/* Storage breakdown */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8, marginTop: 12,
        }}>
          {[
            { label: 'Used',  value: `${storageData.used} MB`,
              color: 'var(--accent)', bg: 'rgba(0,212,255,0.06)' },
            { label: 'Free',  value: `${(storageData.total - storageData.used).toFixed(0)} MB`,
              color: 'var(--green)', bg: 'rgba(0,255,157,0.06)' },
            { label: 'Limit', value: `${(storageData.total / 1024).toFixed(0)} GB`,
              color: 'var(--muted)', bg: 'rgba(255,255,255,0.03)' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 8, textAlign: 'center',
              background: item.bg,
              border: '1px solid var(--border)',
            }}>
              <div style={{
                fontSize: 14, fontWeight: 700,
                color: item.color, fontFamily: 'var(--font-mono)',
                marginBottom: 3,
              }}>
                {item.value}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Warning */}
        {storageData.used / storageData.total > 0.8 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(255,59,92,0.08)',
              border: '1px solid rgba(255,59,92,0.25)',
              fontSize: 12, color: 'var(--red)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Storage almost full — consider removing old files
          </motion.div>
        )}
      </motion.div>

      {/* ── Recent Files Section ── */}
      <motion.div className="files-section" variants={cardVariants}
        initial="initial" animate="animate"
        style={{ marginBottom: 16 }}>

        <div className="files-header">
          <span className="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"
              strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: 'middle' }}>
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13 2 13 9 20 9"/>
            </svg>
            Recent Files
          </span>
          <motion.button className="btn btn-outline sm"
            whileHover={{ x: 3 }}
            onClick={() => onNavigate('files')}>
            View All →
          </motion.button>
        </div>

        {files.length === 0 ? (
          <motion.div variants={fadeIn} initial="initial" animate="animate"
            style={{ textAlign: 'center', padding: '32px 24px' }}>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="var(--muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </motion.div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              No files yet
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              Upload your first file to get started
            </div>
            <motion.button className="btn btn-primary sm"
              whileHover={{ scale: 1.04 }}
              onClick={() => onNavigate('upload')}>
              Upload First File
            </motion.button>
          </motion.div>
        ) : (
          <div>
            {files.slice(0, 5).map((f, i) => {
              const isExpired = f.expiryDate && new Date(f.expiryDate) < new Date();
              const ext = f.filename?.split('.').pop()?.toUpperCase();
              return (
                <motion.div key={f.fileId || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: 12, padding: '10px 0',
                    borderBottom: i < Math.min(files.length, 5) - 1
                      ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => onNavigate('files')}
                  whileHover={{ x: 4 }}
                >
                  {/* File type badge */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(0,212,255,0.06)',
                    border: '1px solid rgba(0,212,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: 'var(--accent)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {ext}
                  </div>

                  {/* File info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: 3,
                    }}>
                      {f.filename}
                    </div>
                    <div style={{
                      display: 'flex', gap: 10, fontSize: 10,
                      color: 'var(--muted)', fontFamily: 'var(--font-mono)',
                    }}>
                      <span>{Math.round((f.fileSize || 0) / 1024)} KB</span>
                      <span>·</span>
                      <span>{new Date(f.uploadedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short',
                      })}</span>
                      {f.txHash && f.txHash !== 'pending' && (
                        <>
                          <span>·</span>
                          <span style={{ color: 'var(--accent)' }}>
                            TX: {f.txHash.slice(0, 8)}...
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <span style={{
                    fontSize: 10, padding: '3px 10px', borderRadius: 20,
                    fontWeight: 600, flexShrink: 0,
                    background: isExpired
                      ? 'rgba(239,159,39,0.1)'
                      : f.status === 'valid'
                      ? 'rgba(0,255,157,0.08)'
                      : f.status === 'tampered'
                      ? 'rgba(255,59,92,0.08)'
                      : 'rgba(127,119,221,0.08)',
                    border: `1px solid ${isExpired
                      ? 'rgba(239,159,39,0.25)'
                      : f.status === 'valid'
                      ? 'rgba(0,255,157,0.2)'
                      : f.status === 'tampered'
                      ? 'rgba(255,59,92,0.2)'
                      : 'rgba(127,119,221,0.2)'}`,
                    color: isExpired ? '#EF9F27'
                      : f.status === 'valid' ? 'var(--green)'
                      : f.status === 'tampered' ? 'var(--red)'
                      : '#7F77DD',
                  }}>
                    {isExpired ? 'Expired' : f.status?.toUpperCase()}
                  </span>
                </motion.div>
              );
            })}

            {/* View more */}
            {files.length > 5 && (
              <div style={{
                textAlign: 'center', paddingTop: 12,
                fontSize: 12, color: 'var(--muted)',
              }}>
                +{files.length - 5} more files ·{' '}
                <button
                  onClick={() => onNavigate('files')}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--accent)', cursor: 'pointer', fontSize: 12,
                  }}>
                  View all →
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Quick Verify ── */}
      <motion.div className="section-card" variants={cardVariants}
        initial="initial" animate="animate"
        style={{ marginBottom: 16 }}>
        <div className="files-header" style={{ marginBottom: 14 }}>
          <span className="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"
              strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: 'middle' }}>
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Quick Verify
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="qv-input"
            placeholder="Enter File ID — e.g. FID-MNLX5R20"
            style={{
              flex: 1, padding: '9px 14px',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 13,
              color: 'var(--text)', outline: 'none',
              fontFamily: 'var(--font-mono)',
            }}
            onKeyDown={e => e.key === 'Enter' && handleQuickVerify()}
          />
          <motion.button
            className="btn btn-primary"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleQuickVerify}
            disabled={qvLoading}
          >
            {qvLoading ? '...' : 'Verify'}
          </motion.button>
        </div>

        {qvResult && !qvResult.found && (
          <div style={{
            marginTop: 10, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            fontSize: 12, color: 'var(--muted)',
          }}>
            No file found with this ID.
          </div>
        )}

        {qvResult?.found && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 10, padding: '12px 14px', borderRadius: 8,
              background: qvResult.file.status === 'valid'
                ? 'rgba(0,255,157,0.06)' : 'rgba(255,59,92,0.06)',
              border: `1px solid ${qvResult.file.status === 'valid'
                ? 'rgba(0,255,157,0.25)' : 'rgba(255,59,92,0.25)'}`,
            }}>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: qvResult.file.status === 'valid' ? 'var(--green)' : 'var(--red)',
              marginBottom: 6,
            }}>
              {qvResult.file.status === 'valid'
                ? '✓ Blockchain seal intact' : '⚠ Hash mismatch detected!'}
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)',
              color: 'var(--muted)',
            }}>
              <span>File: {qvResult.file.filename}</span>
              <span>Size: {formatSize(qvResult.file.fileSize)}</span>
              <span>ID: {qvResult.file.fileId}</span>
              <span>TX: {qvResult.file.txHash?.slice(0, 14)}...</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── IPFS Shard Status ── */}
      <motion.div className="section-card" variants={cardVariants}
        initial="initial" animate="animate"
        style={{ marginBottom: 16 }}>
        <div className="files-header" style={{ marginBottom: 14 }}>
          <span className="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round"
              strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: 'middle' }}>
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
            IPFS Shard Status
          </span>
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 20,
            background: 'rgba(0,255,157,0.1)',
            border: '1px solid rgba(0,255,157,0.25)',
            color: 'var(--green)', fontFamily: 'var(--font-mono)',
          }}>
            4/5 synced
          </span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8, marginBottom: 14,
        }}>
          {[
            { id: 'Node 1', location: 'Mumbai',    status: 'active',  ping: '12ms'  },
            { id: 'Node 2', location: 'Frankfurt', status: 'active',  ping: '48ms'  },
            { id: 'Node 3', location: 'New York',  status: 'active',  ping: '120ms' },
            { id: 'Node 4', location: 'Singapore', status: 'active',  ping: '67ms'  },
            { id: 'Node 5', location: 'London',    status: 'syncing', ping: '55ms'  },
          ].map((node, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                background: node.status === 'active'
                  ? 'rgba(0,255,157,0.05)' : 'rgba(0,212,255,0.05)',
                border: `1px solid ${node.status === 'active'
                  ? 'rgba(0,255,157,0.2)' : 'rgba(0,212,255,0.2)'}`,
                borderRadius: 8, padding: '10px 6px', textAlign: 'center',
              }}>
              <motion.div
                animate={{ scale: node.status === 'active' ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: node.status === 'active' ? 'var(--green)' : 'var(--accent)',
                  margin: '0 auto 6px',
                }}
              />
              <div style={{
                fontSize: 10, fontWeight: 700,
                color: 'var(--text)', marginBottom: 2,
                fontFamily: 'var(--font-mono)',
              }}>
                {node.id}
              </div>
              <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3 }}>
                {node.location}
              </div>
              <div style={{
                fontSize: 9, fontFamily: 'var(--font-mono)',
                color: node.status === 'active' ? 'var(--green)' : 'var(--accent)',
              }}>
                {node.ping}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 11, color: 'var(--muted)',
            fontFamily: 'var(--font-mono)', marginBottom: 6,
          }}>
            <span>Replication progress</span>
            <span style={{ color: 'var(--green)' }}>80%</span>
          </div>
          <div style={{
            height: 4, background: 'var(--border)',
            borderRadius: 20, overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '80%' }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              style={{ height: '100%', background: 'var(--green)', borderRadius: 20 }}
            />
          </div>
        </div>
      </motion.div>


      {/* Tamper Alert */}
      {stats.tampered > 0 && (
        <motion.div className="alert-banner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              {stats.tampered} Tampered File{stats.tampered > 1 ? 's' : ''} Detected!
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>File integrity compromised. Verify immediately.</div>
          </div>
          <motion.button className="btn btn-danger sm" whileHover={{ scale: 1.04 }} onClick={() => onNavigate('verify')}>
            Investigate →
          </motion.button>
        </motion.div>
      )}

    </motion.div>
  );
}
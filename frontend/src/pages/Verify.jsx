import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Verify.css';
import { pageVariants, cardVariants, scalePop } from '../utils/animations';
import { getTxUrl } from '../utils/blockchain';
import { generateCertificate } from '../utils/generateCertificate';
import {
  ShieldCheck, AlertTriangle, CheckCircle, Clipboard,
  ExternalLink, FileText, FileImage, FileCode, FileArchive,
  RefreshCw, Trash2, Loader2, Database, Link as LinkIcon,
  ChevronRight, FileCheck, Search, UploadCloud
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────
const fmtSize = b =>
  !b ? '—' : b < 1024 ? b + ' B' : b < 1048576
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / 1048576).toFixed(2) + ' MB';

const getFileIcon = (file) => {
  if (!file) return <FileText size={24} />;
  const type = file.type || '';
  if (type.includes('image')) return <FileImage size={24} />;
  if (type.includes('zip') || type.includes('rar')) return <FileArchive size={24} />;
  if (type.includes('javascript') || type.includes('json') || type.includes('html')) return <FileCode size={24} />;
  return <FileText size={24} />;
};

export default function Verify({ onNotify, walletAddress }) {
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState('');
  const [fileIdParam, setFileIdParam] = useState(null);
  const fileInputRef = useRef(null);

  // Handle query parameter ?id=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setFileIdParam(id);
      // If we have an ID but no file, maybe show a hint to drop the file for that ID
    }
  }, [location]);

  const STEPS = [
    { n: 1, label: 'Reading File...', icon: <Search size={16} /> },
    { n: 2, label: 'Checking Record...', icon: <Database size={16} /> },
    { n: 3, label: 'Verifying Seal...', icon: <LinkIcon size={16} /> },
  ];

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  const generateHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const doVerify = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setActiveStep(1);

    try {
      // Step 1: Compute Hash
      await generateHash(file);
      await delay(800);
      setActiveStep(2);

      // Step 2: Prepare Request
      console.log("Sending fileId:", fileIdParam);
      const formData = new FormData();
      formData.append('file', file);
      if (fileIdParam) formData.append('fileId', fileIdParam);

      // Step 3: Backend Verification
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/verify`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error('Verification service unavailable');

      const data = await response.json();
      setActiveStep(3);
      await delay(800);

      setResult(data);

      if (typeof onNotify === 'function') {
        const status = data.status?.toUpperCase();
        if (status === 'VALID') {
          onNotify('✅ File integrity verified!', 'success');
        } else if (status === 'TAMPERED') {
          onNotify('⚠️ Tamper detected!', 'error');
        } else if (status === 'NOT_SYNCED') {
          onNotify('🟠 Not synced with blockchain', 'warning');
        } else if (status === 'NOT_FOUND' || status === 'NOT_REGISTERED') {
          onNotify('🚫 File not found in system', 'info');
        }
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
      setActiveStep(0);
    }
  };


  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const shortHash = (h) => h ? `${h.slice(0, 14)}...${h.slice(-10)}` : '—';

  const getStatusConfig = () => {
    // Deriving status based on user's requested logic
    let status = (result?.status || 'UNKNOWN').toUpperCase();
    
    const currentHash = result?.currentHash;
    const originalHash = result?.originalHash;
    const blockchainHash = result?.blockchainHash;

    if (result) {
      if (status === 'NOT_FOUND' || status === 'NOT_REGISTERED') {
        // Keep as NOT_FOUND
      } else if (!blockchainHash) {
        status = 'NOT_SYNCED';
      } else if (currentHash !== originalHash) {
        status = 'TAMPERED';
      } else if (currentHash === originalHash) {
        status = 'VALID';
      }
    }

    console.log("[VERIFY UI] Derived Status:", status, { currentHash, originalHash, blockchainHash });

    switch (status) {
      case 'VALID':
        return {
          class: 'valid',
          badge: 'Verified Authentic',
          title: '✔ This file is safe and unchanged',
          desc: 'We have confirmed this file matches its official record. No changes were detected.',
          color: 'var(--accent-teal)',
          icon: <ShieldCheck size={48} />,
          bg: 'rgba(45, 212, 191, 0.1)',
          shadow: '0 0 30px rgba(45, 212, 191, 0.2)'
        };
      case 'TAMPERED':
        return {
          class: 'tampered',
          badge: 'Modification Detected',
          title: '⚠ This file has been modified',
          desc: 'Warning: This file does not match the original record. It may have been edited or corrupted.',
          color: 'var(--accent-red)',
          icon: <AlertTriangle size={48} />,
          bg: 'rgba(239, 68, 68, 0.1)',
          shadow: '0 0 30px rgba(239, 68, 68, 0.2)'
        };
      case 'NOT_SYNCED':
        return {
          class: 'warning',
          badge: 'Sync Pending',
          title: '⚠ File not fully verified on blockchain',
          desc: 'The file is in our records but the final blockchain proof is still being processed. Please check back shortly.',
          color: '#F59E0B',
          icon: <RefreshCw size={48} />,
          bg: 'rgba(245, 158, 11, 0.1)',
          shadow: '0 0 30px rgba(245, 158, 11, 0.2)'
        };
      case 'NOT_FOUND':
      case 'NOT_REGISTERED':
        return {
          class: 'grey',
          badge: 'Not Found',
          title: '🚫 This file was not found in the system',
          desc: 'We could not find any record of this file. Please make sure you are uploading the correct file.',
          color: '#9CA3AF',
          icon: <Search size={48} />,
          bg: 'rgba(156, 163, 175, 0.1)',
          shadow: '0 0 30px rgba(156, 163, 175, 0.2)'
        };
      default:
        // Fallback for safety, but try to avoid UNKNOWN
        return {
          class: 'tampered',
          badge: 'Status Error',
          title: 'Unable to Verify',
          desc: 'We encountered an issue determining the status. Please try re-uploading the file.',
          color: 'var(--accent-red)',
          icon: <AlertTriangle size={48} />,
          bg: 'rgba(239, 68, 68, 0.1)',
          shadow: '0 0 30px rgba(239, 68, 68, 0.2)'
        };
    }
  };

  const statusConfig = result ? getStatusConfig() : null;
  const isValid = result?.status?.toUpperCase() === 'VALID';

  return (
    <motion.div className="verify-container" variants={pageVariants} initial="initial" animate="animate">

      {/* Page Header */}
      <div className="ph">
        <div>
          <h1>🔍 Verify Your File</h1>
          <p style={{ marginTop: 8 }}>Upload your file again to check if it has been changed or tampered with.</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13 }}>
            <span style={{ color: 'var(--accent-teal)' }}>✔ If the file is the same → It will be verified</span>
            <span style={{ color: 'var(--accent-red)' }}>⚠ If the file was changed → It will be marked as modified</span>
          </div>
        </div>
        {(file || result) && (
          <button className="ref-btn" onClick={reset}>
            <RefreshCw size={14} /> Reset
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!result && (
          <motion.div key="form" variants={cardVariants} initial="initial" animate="animate" exit={{ opacity: 0, y: -20 }}>

            {/* Stepper Header */}
            <div className="v-card" style={{ padding: '0 12px', marginBottom: 20 }}>
              <div className="v-stepper">
                {STEPS.map((step, i) => (
                  <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`v-step-item ${activeStep >= step.n ? 'active' : ''}`}>
                      <div className="v-step-num">{step.n}</div>
                      <span className="v-step-label">{step.label}</span>
                    </div>
                    {i < 2 && <ChevronRight size={14} className="v-step-sep" />}
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="error-box" style={{ marginBottom: 20 }}>{error}</div>}

            {!loading ? (
              <div className="v-card">
                <div
                  className={`v-dropzone ${drag ? 'drag-active' : ''} ${file ? 'file-selected' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => {
                    const f = e.target.files[0];
                    if (f) { setFile(f); setResult(null); setError(''); }
                  }} />

                  {file ? (
                    <div className="v-file-preview">
                      <div className="v-file-icon">
                        {getFileIcon(file)}
                      </div>
                      <div className="v-file-info">
                        <div className="v-file-name">{file.name}</div>
                        <div className="v-file-meta">{fmtSize(file.size)} · Ready for cryptographic audit</div>
                      </div>
                      <button className="v-remove-btn" onClick={e => { e.stopPropagation(); setFile(null); }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div className="v-file-icon" style={{ width: 64, height: 64, color: 'var(--accent-cyan)', background: 'rgba(0, 212, 255, 0.05)' }}>
                        <UploadCloud size={32} />
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>No file selected</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        👉 Choose the same file you uploaded earlier to verify its integrity
                      </div>
                      {fileIdParam && (
                        <div style={{ marginTop: 10, fontSize: 11, padding: '4px 12px', background: 'rgba(167, 139, 250, 0.1)', color: '#A78BFA', borderRadius: 20 }}>
                          Auditing for File ID: {fileIdParam.slice(0, 8)}...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  className="v-btn-execute"
                  disabled={!file}
                  onClick={doVerify}
                  title="Check if this file has been changed"
                >
                  <ShieldCheck size={20} />
                  Check File Integrity
                </button>
              </div>
            ) : (
              /* Processing Animation */
              <div className="v-card v-processing-card">
                <Loader2 size={48} className="spin" style={{ color: 'var(--accent-cyan)', marginBottom: 20 }} />
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Auditing Integrity...</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Please do not close this window while we verify the official digital seal.</div>

                <div className="v-processing-steps">
                  {STEPS.map((step) => {
                    const done = activeStep > step.n;
                    const active = activeStep === step.n;
                    return (
                      <div key={step.n} className={`v-proc-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                        <div className="v-step-num">
                          {done ? <CheckCircle size={14} /> : active ? <Loader2 size={14} className="spin" /> : step.n}
                        </div>
                        <span className="v-step-label" style={{ flex: 1, textAlign: 'left' }}>{step.label}</span>
                        {done && <span style={{ fontSize: 11, color: 'var(--accent-teal)', fontWeight: 700 }}>COMPLETED</span>}
                        {active && <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700 }}>PROCESSING</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Result View */}
        {result && (
          <motion.div key="result" variants={scalePop} initial="initial" animate="animate">
            <div className={`v-card v-result-verdict ${statusConfig.class}`}>
              <div className={`v-status-badge ${statusConfig.class}`}>
                {statusConfig.badge}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: statusConfig.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: statusConfig.color,
                  boxShadow: statusConfig.shadow
                }}>
                  {statusConfig.icon}
                </div>
              </div>
              <h2 className="v-verdict-title" style={{ color: statusConfig.color }}>
                {statusConfig.title}
              </h2>
              <p className="v-verdict-desc">
                {statusConfig.desc}
              </p>
            </div>

            <div className="v-hash-grid">
              {/* Original Hash */}
              <div className="v-hash-box">
                <div className="v-hash-label">
                  <Database size={14} /> Original Identity
                </div>
                <div className="v-hash-value-wrap">
                  <div className="v-hash-value">{shortHash(result.originalHash)}</div>
                  <button className="v-copy-btn" onClick={() => copyText(result.originalHash, 'orig')}>
                    {copied === 'orig' ? <CheckCircle size={14} /> : <Clipboard size={14} />}
                  </button>
                </div>
              </div>

              {/* Blockchain Hash */}
              <div className="v-hash-box">
                <div className="v-hash-label">
                  <LinkIcon size={14} /> Digital Seal
                </div>
                <div className="v-hash-value-wrap">
                  <div className="v-hash-value">{shortHash(result.blockchainHash)}</div>
                  <button className="v-copy-btn" onClick={() => copyText(result.blockchainHash, 'chain')}>
                    {copied === 'chain' ? <CheckCircle size={14} /> : <Clipboard size={14} />}
                  </button>
                </div>
              </div>

              {/* Current Hash */}
              <div className="v-hash-box" style={{ gridColumn: 'span 2' }}>
                <div className="v-hash-label">
                  <FileCheck size={14} /> Current File Identity
                </div>
                <div className="v-hash-value-wrap" style={{ borderColor: statusConfig.color + '4D' }}>
                  <div className="v-hash-value" style={{ color: statusConfig.color }}>
                    {result.currentHash}
                  </div>
                  <button className="v-copy-btn" onClick={() => copyText(result.currentHash, 'curr')}>
                    {copied === 'curr' ? <CheckCircle size={14} /> : <Clipboard size={14} />}
                  </button>
                </div>
              </div>
            </div>


            {/* Verification Proofs */}
            <div className="v-card" style={{ marginBottom: 20 }}>
              <div className="pf-section-label" style={{ marginBottom: 16 }}>Official Record</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="pf-info-row">
                  <span className="pf-info-key">Database Check</span>
                  <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>SUCCESS</span>
                </div>
                <div className="pf-info-row">
                  <span className="pf-info-key">Blockchain Check</span>
                  <span style={{ color: result.blockchainHash ? 'var(--accent-teal)' : 'var(--accent-red)', fontWeight: 700 }}>
                    {result.blockchainHash ? 'AUTHENTIC' : 'NOT_SYNCED'}
                  </span>
                </div>
                {result.txHash && result.txHash !== 'pending' && (
                  <div className="pf-info-row" style={{ gridColumn: 'span 2' }}>
                    <span className="pf-info-key">Ledger Transaction</span>
                    <a href={getTxUrl(result.txHash)} target="_blank" rel="noreferrer" style={{ color: '#A78BFA', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      {result.txHash.slice(0, 16)}... <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="pf-btn pf-btn-ghost" style={{ flex: 1 }} onClick={reset}>
                <RefreshCw size={14} /> Verify Another
              </button>
              {isValid && (
                <button className="v-btn-execute" style={{ flex: 1.5, marginTop: 0 }} onClick={() => generateCertificate({ ...result, walletAddress })}>
                  <FileCheck size={18} /> GENERATE CERTIFICATE
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));
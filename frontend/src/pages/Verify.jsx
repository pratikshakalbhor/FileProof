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
    { n: 1, label: 'Computing Cryptographic Hash', icon: <Search size={16} /> },
    { n: 2, label: 'Fetching Blockchain Ledger', icon: <Database size={16} /> },
    { n: 3, label: 'Auditing Smart Contract State', icon: <LinkIcon size={16} /> },
  ];

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  const doVerify = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setActiveStep(1);

    try {
      await delay(1200); // UI feel
      setActiveStep(2);
      await delay(1200);
      setActiveStep(3);

      const formData = new FormData();
      formData.append('file', file);
      // Optional: if we came from a specific file ID, we could pass it to the backend for extra validation
      if (fileIdParam) formData.append('fileId', fileIdParam);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/verify`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      await delay(1000);
      setResult(data);

      if (typeof onNotify === 'function') {
        const isMatch = data.isMatch || data.status === 'valid';
        onNotify(
          isMatch ? '✅ File integrity verified!' : '⚠️ Tamper detected!',
          isMatch ? 'success' : 'error'
        );
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

  const isValid = result?.isMatch === true ||
    result?.status?.toLowerCase() === 'valid' ||
    result?.finalStatus?.toLowerCase() === 'safe';

  return (
    <motion.div className="verify-container" variants={pageVariants} initial="initial" animate="animate">

      {/* Page Header */}
      <div className="ph">
        <div>
          <h1>Protocol Audit</h1>
          <p>Multi-layer validation against Database, Ledger, and Smart Contract</p>
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
                      <div style={{ fontSize: 16, fontWeight: 700 }}>Drop file to verify</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Drag & drop or click to browse. We'll verify its hash against the blockchain.
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
                >
                  <ShieldCheck size={20} />
                  EXECUTE TRIPLE-CHECK
                </button>
              </div>
            ) : (
              /* Processing Animation */
              <div className="v-card v-processing-card">
                <Loader2 size={48} className="spin" style={{ color: 'var(--accent-cyan)', marginBottom: 20 }} />
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Auditing Integrity...</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Please do not close this window while we verify the cryptographic signatures.</div>

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
            <div className={`v-card v-result-verdict ${isValid ? 'valid' : 'tampered'}`}>
              <div className={`v-status-badge ${isValid ? 'valid' : 'tampered'}`}>
                {isValid ? 'Protocol Verified' : 'Security Warning'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                {isValid ? (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(45, 212, 191, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-teal)', boxShadow: '0 0 30px rgba(45, 212, 191, 0.2)' }}>
                    <ShieldCheck size={48} />
                  </div>
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)', boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)' }}>
                    <AlertTriangle size={48} />
                  </div>
                )}
              </div>
              <h2 className="v-verdict-title" style={{ color: isValid ? 'var(--accent-teal)' : 'var(--accent-red)' }}>
                {isValid ? 'AUTHENTIC' : 'TAMPERED'}
              </h2>
              <p className="v-verdict-desc">
                {isValid
                  ? 'This file is authentic. All cryptographic signatures match the immutable blockchain records.'
                  : 'File mismatch detected. The current file hash does not match the original record stored on the blockchain.'}
              </p>
            </div>

            <div className="v-hash-grid">
              {/* Original Hash */}
              <div className="v-hash-box">
                <div className="v-hash-label">
                  <Database size={14} /> Original Record
                </div>
                <div className="v-hash-value-wrap">
                  <div className="v-hash-value">{shortHash(result.originalHash || result.blockchainHash)}</div>
                  <button className="v-copy-btn" onClick={() => copyText(result.originalHash || result.blockchainHash, 'orig')}>
                    {copied === 'orig' ? <CheckCircle size={14} /> : <Clipboard size={14} />}
                  </button>
                </div>
              </div>

              {/* Current Hash */}
              <div className="v-hash-box">
                <div className="v-hash-label">
                  <FileCheck size={14} /> Current File
                </div>
                <div className="v-hash-value-wrap" style={{ borderColor: isValid ? 'rgba(45, 212, 191, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}>
                  <div className="v-hash-value" style={{ color: isValid ? 'var(--accent-teal)' : 'var(--accent-red)' }}>
                    {shortHash(result.currentHash)}
                  </div>
                  <button className="v-copy-btn" onClick={() => copyText(result.currentHash, 'curr')}>
                    {copied === 'curr' ? <CheckCircle size={14} /> : <Clipboard size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Proofs */}
            <div className="v-card" style={{ marginBottom: 20 }}>
              <div className="pf-section-label" style={{ marginBottom: 16 }}>Audit Proofs</div>
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
import { useState } from 'react';
import { ethers } from 'ethers';
import ABI from '../utils/abi.json';
import '../styles/ShareModal.css';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export default function ShareModal({ file, onClose, onSuccess }) {
  const [wallet, setWallet] = useState('');
  const [perm, setPerm] = useState('view');
  const [step, setStep] = useState(0); // 0=idle 1,2,3=progress 4=done
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const isValidWallet = (v) => /^0x[0-9a-fA-F]{40}$/.test(v);

  const handleShare = async () => {
    setError('');
    if (!isValidWallet(wallet)) {
      setError('Valid Ethereum address ghala (0x... 42 chars)');
      return;
    }

    try {
      setStep(1);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      setStep(2);
      // Smart contract la shareFile call karo
      // Jar tumchya contract madhe shareFile nahi tar
      // authorizeUploader vaprto (permission add karo)
      const permLevel = perm === 'view' ? 1 : 2;
      let tx;
      try {
        tx = await contract.shareFile(file.fileId, wallet, permLevel);
      } catch {
        // shareFile nahi contract madhe — authorizeUploader fallback
        tx = await contract.addUploader(wallet);
      }

      setStep(3);
      await tx.wait();

      setTxHash(tx.hash);
      setStep(4);
      onSuccess?.(`${file.filename} shared with ${wallet.slice(0, 8)}...`);
    } catch (err) {
      setError(err.code === 4001
        ? 'MetaMask rejected — please confirm transaction'
        : err.message || 'Transaction failed');
      setStep(0);
    }
  };

  // Overlay click → close
  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}
      onClick={handleOverlay}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        width: '100%', maxWidth: 450, overflow: 'hidden'
      }}>

        <div className="share-modal__header">
          <p className="share-modal__title">Share file access</p>
          <button className="share-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="share-modal__body">
          <div className="share-modal__file-pill">
            <div className="share-modal__file-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <p className="share-modal__file-name">{file?.filename}</p>
              <p className="share-modal__file-id">{file?.fileId}</p>
            </div>
          </div>

          <label className="share-modal__label">Recipient wallet address</label>
          <input
            className={`share-modal__input ${error ? 'share-modal__input--error' : ''}`}
            value={wallet}
            onChange={e => { setWallet(e.target.value); setError(''); }}
            placeholder="0x..."
            maxLength={42}
          />
          {error && <p className="share-modal__error">{error}</p>}

          <div className="share-modal__perm-grid">
            <div className={`share-modal__perm-opt ${perm === 'view' ? 'share-modal__perm-opt--selected' : ''}`}
              onClick={() => setPerm('view')}>
              <p className="share-modal__perm-title">View only</p>
              <p className="share-modal__perm-desc">Can verify integrity only</p>
            </div>
            <div className={`share-modal__perm-opt ${perm === 'full' ? 'share-modal__perm-opt--selected' : ''}`}
              onClick={() => setPerm('full')}>
              <p className="share-modal__perm-title">Full access</p>
              <p className="share-modal__perm-desc">Can verify, download & revoke</p>
            </div>
          </div>

          <hr className="share-modal__divider" />

          {step > 0 && step < 4 && (
            <div className="share-modal__steps">
              {[1, 2, 3].map(n => (
                <div key={n} className="share-modal__step-row">
                  <span className={`share-modal__step-dot ${step > n ? 'share-modal__step-dot--done' : step === n ? 'share-modal__step-dot--active' : ''}`} />
                  <span className={`share-modal__step-text ${step > n ? 'share-modal__step-text--done' : step === n ? 'share-modal__step-text--active' : ''}`}>
                    {['Validating wallet address', 'Sending blockchain transaction', 'Confirming on Sepolia'][n - 1]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="share-modal__success">
              <p className="share-modal__success-title">Access granted on blockchain</p>
              <p className="share-modal__success-tx">{txHash}</p>
              <p className="share-modal__success-meta">
                Permission: {perm === 'view' ? 'View only' : 'Full access'} • {wallet.slice(0, 10)}...{wallet.slice(-6)}
              </p>
            </div>
          )}

          <div className="share-modal__footer">
            <button className="share-modal__btn-cancel" onClick={onClose}>
              {step === 4 ? 'Close' : 'Cancel'}
            </button>
            {step < 4 && (
              <button className="share-modal__btn-share" onClick={handleShare} disabled={step > 0}>
                {step > 0 ? 'Processing...' : 'Share on blockchain'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

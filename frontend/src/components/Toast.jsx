import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotification } from '../context/NotificationContext';
import './Toast.css';

// ── Per-type config ──────────────────────
const TYPE_CONFIG = {
  success: {
    label:  'Success',
    color:  '#00ff9d',
    glow:   'rgba(0, 255, 157, 0.18)',
    border: 'rgba(0, 255, 157, 0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  error: {
    label:  'Alert',
    color:  '#ff3b5c',
    glow:   'rgba(255, 59, 92, 0.18)',
    border: 'rgba(255, 59, 92, 0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  pending: {
    label:  'Pending',
    color:  '#00d4ff',
    glow:   'rgba(0, 212, 255, 0.18)',
    border: 'rgba(0, 212, 255, 0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="toast-spin">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  info: {
    label:  'Info',
    color:  '#a78bfa',
    glow:   'rgba(167, 139, 250, 0.18)',
    border: 'rgba(167, 139, 250, 0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
};

// ── Single Toast item ────────────────────
function ToastItem({ toast }) {
  const { dismiss } = useNotification();
  const cfg = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info;
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef(null);

  // Drain progress bar
  useEffect(() => {
    const step    = 100 / (toast.duration / 50);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) { clearInterval(intervalRef.current); return 0; }
        return p - step;
      });
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [toast.duration]);

  return (
    <motion.div
      layout
      className="toast-item"
      style={{
        '--toast-color':  cfg.color,
        '--toast-glow':   cfg.glow,
        '--toast-border': cfg.border,
      }}
      variants={{
        hidden: { opacity: 0, x: 80, scale: 0.94 },
        show:   { opacity: 1, x: 0,  scale: 1,   transition: { type: 'spring', stiffness: 380, damping: 28 } },
        exit:   { opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } },
      }}
      initial="hidden"
      animate="show"
      exit="exit"
      whileHover={{ scale: 1.015 }}
    >
      {/* Glow blob */}
      <div className="toast-glow" />

      {/* Icon */}
      <div className="toast-icon">{cfg.icon}</div>

      {/* Body */}
      <div className="toast-body">
        <div className="toast-label">{cfg.label}</div>
        <div className="toast-message">{toast.message}</div>
      </div>

      {/* Close */}
      <button className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Progress bar */}
      <div className="toast-progress-track">
        <motion.div
          className="toast-progress-bar"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}

// ── Toast Container (renders all active toasts) ──
export default function ToastContainer() {
  const { toasts } = useNotification();

  return (
    <div className="toast-container" aria-live="polite" aria-label="Notifications">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

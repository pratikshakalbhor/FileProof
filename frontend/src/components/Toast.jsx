import React from 'react';
import { motion } from 'framer-motion';
import { notifVariants } from '../utils/animations';

const ICONS = {
  success: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  error: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  info: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
};

const COLORS = {
  success: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10B981', text: '#D1FAE5' },
  error: { bg: 'rgba(239, 68, 68, 0.1)', border: '#EF4444', text: '#FEE2E2' },
  info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3B82F6', text: '#DBEAFE' }
};

const Toast = ({ message, type }) => {
  const style = COLORS[type] || COLORS.info;

  return (
    <motion.div
      variants={notifVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        background: 'var(--surface, #1a1a1a)',
        borderLeft: `4px solid ${style.border}`,
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: '300px',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ color: style.border }}>{ICONS[type]}</div>
      <div style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>
        {message}
      </div>
    </motion.div>
  );
};

export default Toast;
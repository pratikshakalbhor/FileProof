import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationDropdown({ notifications = [], clearNotification }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.length;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle size={16} className="color-success" style={{ color: '#10b981' }} />;
      case 'WARNING': return <AlertTriangle size={16} className="color-warning" style={{ color: '#f59e0b' }} />;
      case 'CRITICAL': return <ShieldAlert size={16} className="color-danger" style={{ color: '#ef4444' }} />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <div
        className="nav-icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative', padding: '8px' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '6px', right: '6px', background: '#ef4444',
            width: '10px', height: '10px', borderRadius: '50%', border: '2px solid var(--bg-navbar)'
          }} />
        )}
      </div>

      {isOpen && (
        <div className="dropdown-panel" style={{
          position: 'absolute', top: '100%', right: 0, width: '320px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          marginTop: '10px', zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
              {unreadCount} New
            </span>
          </div>

          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No new alerts
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} style={{
                  padding: '12px 15px', borderBottom: '1px solid var(--border)',
                  display: 'flex', gap: '12px', position: 'relative'
                }}>
                  <div style={{ marginTop: '2px' }}>{getIcon(n.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{n.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>{n.time}</div>
                  </div>
                  <button
                    onClick={() => clearNotification(n.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div
            onClick={() => { navigate('/blockchain-log'); setIsOpen(false); }}
            style={{
              padding: '12px', textAlign: 'center', fontSize: '12px',
              color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600,
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            View Activity Log
          </div>
        </div>
      )}
    </div>
  );
}
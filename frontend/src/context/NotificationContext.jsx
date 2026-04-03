import { createContext, useCallback, useContext, useRef, useState } from 'react';

// ─────────────────────────────────────────
// NotificationContext — global toast manager
// Usage: const { notify } = useNotification();
//        notify('File sealed!', 'success');
//        notify('Tamper detected!', 'error');
//        notify('Tx pending...', 'pending');
// ─────────────────────────────────────────

const NotificationContext = createContext(null);

let _idCounter = 0;

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message, type = 'info', duration = 4500) => {
    const id = ++_idCounter;

    setToasts((prev) => [
      // Cap at 5 visible toasts — drop the oldest
      ...prev.slice(-4),
      { id, message, type, duration, createdAt: Date.now() },
    ]);

    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  // Convenience shorthands
  const success = useCallback((msg, dur) => notify(msg, 'success', dur), [notify]);
  const error   = useCallback((msg, dur) => notify(msg, 'error',   dur), [notify]);
  const pending = useCallback((msg, dur) => notify(msg, 'pending', dur ?? 6000), [notify]);
  const info    = useCallback((msg, dur) => notify(msg, 'info',    dur), [notify]);

  return (
    <NotificationContext.Provider value={{ notify, success, error, pending, info, dismiss, toasts }}>
      {children}
    </NotificationContext.Provider>
  );
}

// ── Custom hook ──
export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within <NotificationProvider>');
  return ctx;
}

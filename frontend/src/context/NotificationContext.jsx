import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';
import { AnimatePresence } from 'framer-motion';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="toast-container" style={{
        position: 'fixed', top: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 12
      }}>
        <AnimatePresence>
          {notifications.map((n) => (
            <Toast key={n.id} message={n.message} type={n.type} />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
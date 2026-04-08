import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toaster } from './Toast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => {
      // D-04: max 3 visible — drop oldest if at limit
      const next = prev.length >= 3 ? prev.slice(1) : prev;
      return [...next, { id, type, message, exiting: false }];
    });
  }, []);

  const startExit = useCallback((id) => {
    setToasts(prev => prev.map(t =>
      t.id === id ? { ...t, exiting: true } : t
    ));
    // D-15: fade-out 200ms, then remove from DOM
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 200);
  }, []);

  const toast = {
    error: (msg) => addToast('error', msg),
    success: (msg) => addToast('success', msg),
    info: (msg) => addToast('info', msg),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toaster toasts={toasts} onDismiss={startExit} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

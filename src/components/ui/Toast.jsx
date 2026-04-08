import { useEffect } from 'react';
import './Toast.css';

export function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    if (toast.exiting) return; // Don't set new timer while exiting
    const timer = setTimeout(() => onDismiss(toast.id), 8000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.exiting, onDismiss]);

  return (
    <div
      className={`toast toast--${toast.type}${toast.exiting ? ' toast--exiting' : ''}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <span className="toast__message">{toast.message}</span>
      <button
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fechar notificacao"
      >
        &times;
      </button>
    </div>
  );
}

export function Toaster({ toasts, onDismiss }) {
  return (
    <div className="toaster" aria-live="polite" aria-relevant="additions removals">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

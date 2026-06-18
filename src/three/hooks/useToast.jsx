import { createContext, useContext, useState, useCallback } from 'react';

const ToastCtx = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'success') => {
    const id = ++idCounter;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const toast = {
    success: (msg) => add(msg, 'success'),
    error:   (msg) => add(msg, 'error'),
    info:    (msg) => add(msg, 'info'),
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 10, zIndex: 9999,
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 20px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            color: '#fff',
            minWidth: 260,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.2s ease',
            background: t.type === 'success' ? '#16a34a'
                      : t.type === 'error'   ? '#dc2626'
                      : '#2563eb',
          }}>
            {t.type === 'success' ? '✓ ' : t.type === 'error' ? '✕ ' : 'ℹ '}{t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'], duration = 5000) => {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px'
      }}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getToastStyles = (type: Toast['type']) => {
    const baseStyles = {
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '14px',
      fontWeight: 500,
      maxWidth: '400px',
      animation: 'slideIn 0.3s ease-out'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          background: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb'
        };
      case 'error':
        return {
          ...baseStyles,
          background: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb'
        };
      case 'warning':
        return {
          ...baseStyles,
          background: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeaa7'
        };
      case 'info':
      default:
        return {
          ...baseStyles,
          background: '#d1ecf1',
          color: '#0c5460',
          border: '1px solid #bee5eb'
        };
    }
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  };

  return (
    <div
      style={getToastStyles(toast.type)}
      role="alert"
      aria-live="assertive"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{getIcon(toast.type)}</span>
        <span>{toast.message}</span>
      </div>
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          opacity: 0.7,
          padding: '0',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Close notification"
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        ×
      </button>
    </div>
  );
}

// Add slide-in animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

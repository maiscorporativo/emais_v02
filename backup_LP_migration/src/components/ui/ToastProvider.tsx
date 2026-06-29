/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: '#0d3320', border: '#1a5c38', icon: '#4ade80' },
  warning: { bg: '#2a1a00', border: '#7a4a00', icon: '#fbbf24' },
  error:   { bg: '#3a0d0d', border: '#7a1a1a', icon: '#f87171' },
  info:    { bg: '#0d1f35', border: '#1a3a5c', icon: '#7bc4e8' },
};

function ToastIcon({ type }: { type: ToastType }) {
  const size = 18;
  const c = COLORS[type].icon;
  if (type === 'success') return <CheckCircle2 size={size} color={c} />;
  if (type === 'warning') return <AlertTriangle size={size} color={c} />;
  if (type === 'error')   return <XCircle size={size} color={c} />;
  return <Info size={size} color={c} />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Keyframes */}
      <style>{`
        @keyframes _toast_in {
          from { opacity: 0; transform: translateY(-14px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      {/* Container */}
      <div style={{
        position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 99999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        pointerEvents: 'none',
        width: 'max-content', maxWidth: 'min(420px, calc(100vw - 32px))',
      }}>
        {toasts.map(t => {
          const c = COLORS[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: '12px 16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
                animation: '_toast_in 0.25s ease both',
                pointerEvents: 'auto',
                width: '100%',
                backdropFilter: 'blur(8px)',
              }}
            >
              <ToastIcon type={t.type} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#e8edf2', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.4 }}>
                {t.message}
              </span>
              <button
                onClick={() => remove(t.id)}
                aria-label="Fechar"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', padding: 2, flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

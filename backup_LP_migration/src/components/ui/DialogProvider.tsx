/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle, Flame } from 'lucide-react';

type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'danger';

interface DialogOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
}

interface DialogState extends DialogOptions {
  resolve: (value: boolean) => void;
}

interface DialogContextType {
  showAlert: (message: string, type?: DialogType) => Promise<void>;
  showConfirm: (message: string, options?: Partial<DialogOptions>) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

const THEME: Record<DialogType, { bg: string; border: string; iconColor: string; btnBg: string; btnHover: string }> = {
  info:    { bg: '#111111', border: '#333333', iconColor: '#e43c44', btnBg: '#222222', btnHover: '#333333' },
  success: { bg: '#0a1a10', border: '#11331a', iconColor: '#4ade80', btnBg: '#1a5c38', btnHover: '#1e7a48' },
  warning: { bg: '#1a1400', border: '#4d3300', iconColor: '#fbbf24', btnBg: '#7a4a00', btnHover: '#9a5a00' },
  error:   { bg: '#1a0505', border: '#441111', iconColor: '#e43c44', btnBg: '#441111', btnHover: '#661a1a' },
  confirm: { bg: '#111111', border: '#333333', iconColor: '#e43c44', btnBg: '#222222', btnHover: '#333333' },
  danger:  { bg: '#1a0505', border: '#441111', iconColor: '#e43c44', btnBg: '#441111', btnHover: '#661a1a' },
};

function DialogIcon({ type }: { type: DialogType }) {
  const size = 28;
  const c = THEME[type].iconColor;
  switch (type) {
    case 'success': return <CheckCircle2 size={size} color={c} />;
    case 'warning': return <Flame size={size} color={c} />;
    case 'error':   return <XCircle size={size} color={c} />;
    case 'danger':  return <AlertTriangle size={size} color={c} />;
    case 'confirm': return <Info size={size} color={c} />;
    default:        return <Info size={size} color={c} />;
  }
}

function getDefaultTitle(type: DialogType): string {
  switch (type) {
    case 'success': return 'Sucesso';
    case 'warning': return 'Atenção';
    case 'error':   return 'Erro';
    case 'danger':  return 'Confirmação';
    case 'confirm': return 'Confirmar';
    default:        return 'Aviso';
  }
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [closing, setClosing] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((result: boolean) => {
    setClosing(true);
    setTimeout(() => {
      dialog?.resolve(result);
      setDialog(null);
      setClosing(false);
    }, 180);
  }, [dialog]);

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (dialog && !closing) {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [dialog, closing]);

  // ESC to close
  useEffect(() => {
    if (!dialog) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dialog, close]);

  const showAlert = useCallback((message: string, type: DialogType = 'info') => {
    return new Promise<void>((resolve) => {
      setDialog({ message, type, resolve: () => resolve() });
    });
  }, []);

  const showConfirm = useCallback((message: string, options?: Partial<DialogOptions>) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        message,
        type: options?.type ?? 'confirm',
        title: options?.title,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        resolve,
      });
    });
  }, []);

  const isConfirmType = dialog?.type === 'confirm' || dialog?.type === 'danger';
  const type = dialog?.type ?? 'info';
  const theme = THEME[type];
  const title = dialog?.title ?? getDefaultTitle(type);
  const confirmText = dialog?.confirmText ?? (isConfirmType ? 'Confirmar' : 'OK');
  const cancelText = dialog?.cancelText ?? 'Cancelar';

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <style>{`
        @keyframes _dialog_overlay_in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes _dialog_overlay_out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes _dialog_in { from { opacity: 0; transform: scale(0.92) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes _dialog_out { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.92) translateY(10px); } }
        @keyframes _dialog_icon_pop { 0% { transform: scale(0); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
      `}</style>

      {dialog && (
        <div
          onClick={() => close(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            animation: closing ? '_dialog_overlay_out 0.18s ease forwards' : '_dialog_overlay_in 0.2s ease both',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0a0a0a',
              border: `1px solid ${theme.border}`,
              borderRadius: 20,
              padding: '32px 28px 24px',
              width: 'min(400px, calc(100vw - 40px))',
              boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px ${theme.border}44, inset 0 1px 0 rgba(255,255,255,0.04)`,
              animation: closing ? '_dialog_out 0.18s ease forwards' : '_dialog_in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            }}
          >
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `${theme.iconColor}15`,
              border: `2px solid ${theme.iconColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: '_dialog_icon_pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
            }}>
              <DialogIcon type={type} />
            </div>

            {/* Title */}
            <h3 style={{
              margin: 0, fontSize: 17, fontWeight: 800,
              color: theme.iconColor,
              textAlign: 'center',
            }}>
              {title}
            </h3>

            {/* Message */}
            <p style={{
              margin: 0, fontSize: 14, lineHeight: 1.6,
              color: '#b0bec5',
              textAlign: 'center',
              maxWidth: 320,
            }}>
              {dialog.message}
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8, width: '100%' }}>
              {isConfirmType && (
                <button
                  onClick={() => close(false)}
                  style={{
                    flex: 1, padding: '12px 16px',
                    background: '#111111',
                    border: '1px solid #262626',
                    borderRadius: 12, fontSize: 13, fontWeight: 600,
                    color: '#8899aa', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#262626'; e.currentTarget.style.color = '#e5e5e5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#111111'; e.currentTarget.style.color = '#8899aa'; }}
                >
                  {cancelText}
                </button>
              )}
              <button
                ref={confirmBtnRef}
                onClick={() => close(true)}
                style={{
                  flex: 1, padding: '12px 16px',
                  background: type === 'danger'
                    ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                    : type === 'warning'
                      ? 'linear-gradient(135deg, #e43c44, #d45f1a)'
                      : `linear-gradient(135deg, ${theme.iconColor}, ${theme.iconColor}cc)`,
                  border: 'none',
                  borderRadius: 12, fontSize: 13, fontWeight: 700,
                  color: type === 'success' || type === 'info' || type === 'confirm' ? '#000' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: `0 4px 16px ${theme.iconColor}30`,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within a DialogProvider');
  return ctx;
}

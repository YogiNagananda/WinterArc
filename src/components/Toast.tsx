import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Date.now().toString();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 3500);
  },
  removeToast: (id) => {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
  },
}));

const typeConfig: Record<Toast['type'], { color: string; emoji: string }> = {
  success: { color: 'var(--color-success)', emoji: '✓' },
  error:   { color: 'var(--color-danger)',  emoji: '✕' },
  info:    { color: 'var(--color-info)',    emoji: 'ℹ' },
  warning: { color: 'var(--color-warning)', emoji: '⚠' },
};

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  const removeToast = useToastStore(s => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map(toast => {
        const config = typeConfig[toast.type];
        return (
          <div
            key={toast.id}
            className="toast"
            onClick={() => removeToast(toast.id)}
            role="alert"
          >
            <span
              className="toast-icon"
              style={{ background: config.color }}
              aria-hidden="true"
            />
            <span style={{ flex: 1 }}>{toast.message}</span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                marginLeft: 'auto',
              }}
              aria-hidden="true"
            >
              ✕
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  return useToastStore(s => s.addToast);
}

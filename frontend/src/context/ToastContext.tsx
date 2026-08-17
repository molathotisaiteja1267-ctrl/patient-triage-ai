import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    title?: string,
    duration = 4000
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = { id, type, title, message, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((msg: string, title?: string) => showToast(msg, 'success', title), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast(msg, 'error', title, 6000), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast(msg, 'warning', title, 5000), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast(msg, 'info', title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Render Hub */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          const isInfo = t.type === 'info';

          const cardStyles = isSuccess
            ? 'bg-[#EAF8EF] border-[#B7E4C7] text-[#16A34A]'
            : isError
            ? 'bg-[#FDECEC] border-[#F3A6A6] text-[#DC2626]'
            : isWarning
            ? 'bg-[#FFF7E6] border-[#F5C451] text-[#D97706]'
            : 'bg-[#EAF2FF] border-[#C9DBF8] text-[#2563EB]';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-3.5 rounded-lg border shadow-lg transition-all duration-300 flex items-start gap-3 text-xs ${cardStyles} animate-in slide-in-from-bottom-5`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />}
                {isError && <XCircle className="w-4 h-4 text-[#DC2626]" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-[#D97706]" />}
                {isInfo && <Info className="w-4 h-4 text-[#2563EB]" />}
              </div>

              <div className="flex-1 min-w-0">
                {t.title && <div className="font-bold text-[#172033] mb-0.5">{t.title}</div>}
                <div className="text-[#172033] font-medium leading-relaxed break-words">{t.message}</div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-[#64748B] hover:text-[#172033] p-1 rounded transition-colors -mr-1 -mt-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

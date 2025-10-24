'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-500/20 border-green-500/30 text-green-300',
    iconClassName: 'text-green-400',
  },
  error: {
    icon: XCircle,
    className: 'bg-red-500/20 border-red-500/30 text-red-300',
    iconClassName: 'text-red-400',
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
    iconClassName: 'text-yellow-400',
  },
};

export default function ToastComponent({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = typeConfig[toast.type].icon;

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onRemove(toast.id), 300);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${typeConfig[toast.type].className}`}
        role="alert"
        aria-live="polite"
      >
        <Icon size={20} className={`mt-0.5 ${typeConfig[toast.type].iconClassName}`} />
        <div className="flex-1 min-w-0">
          <p className="font-medium">{toast.title}</p>
          {toast.message && (
            <p className="mt-1 text-sm opacity-80">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
          }}
          className="rounded-md p-1 hover:bg-white/10 transition-colors"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// Hook pour gérer les toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (title: string, message?: string, duration = 5000) => {
    addToast({ type: 'success', title, message, duration });
  };

  const error = (title: string, message?: string, duration = 7000) => {
    addToast({ type: 'error', title, message, duration });
  };

  const warning = (title: string, message?: string, duration = 5000) => {
    addToast({ type: 'warning', title, message, duration });
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
  };
}

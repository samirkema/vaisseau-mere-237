'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const styles: Record<ToastType, string> = {
  success: 'border-green-500 text-green-400',
  error:   'border-red-500 text-red-400',
  info:    'border-blue-500 text-blue-400',
};

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={cn('fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border px-4 py-3 shadow-md', styles[type])} style={{ background: '#111', zIndex: 9998 }}>
      <div className="flex items-start gap-2">
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-auto text-current opacity-60 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}

// Hook simple pour gérer les toasts
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const show = (message: string, type: ToastType = 'info') => setToast({ message, type });
  const hide = () => setToast(null);

  return { toast, show, hide };
}

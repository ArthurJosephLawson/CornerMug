import { useCallback, useEffect, useState } from 'react';

export type ToastVariant = 'info' | 'success' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

let toastId = 0;
let items: ToastItem[] = [];
const listeners = new Set<(next: ToastItem[]) => void>();

function emit(): void {
  const snapshot = [...items];
  listeners.forEach((listener) => listener(snapshot));
}

export function showToast(message: string, variant: ToastVariant = 'info'): number {
  toastId += 1;
  const id = toastId;
  items = [...items.slice(-3), { id, message, variant }];
  emit();
  window.setTimeout(() => dismissToast(id), 4200);
  return id;
}

export function dismissToast(id: number): void {
  items = items.filter((toast) => toast.id !== id);
  emit();
}

/** Subscribes a component to the global toast queue. */
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(items);

  useEffect(() => {
    listeners.add(setToasts);
    setToasts([...items]);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  const notify = useCallback((message: string, variant: ToastVariant = 'info') => {
    showToast(message, variant);
  }, []);

  return { toasts, notify, dismiss: dismissToast };
}
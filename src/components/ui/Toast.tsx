import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToast, type ToastVariant } from '@/hooks/useToast';

const variantStyles: Record<ToastVariant, string> = {
  info: 'border-powder-deep/40 bg-powder/70',
  success: 'border-sage-deep/40 bg-sage/70',
  error: 'border-pink-deep/40 bg-pink/70',
};

const variantIcons: Record<ToastVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

export function ToastHost() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-72 flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = variantIcons[toast.variant];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-card ${variantStyles[toast.variant]}`}
            role="status"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 text-charcoal dark:text-[#f4f1ea]">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded-full p-0.5 text-charcoal/50 hover:text-charcoal dark:text-white/60 dark:hover:text-white"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

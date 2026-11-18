import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Mobile bottom sheet: dimmed backdrop, rounded panel, close button and
 * Escape support. Callers decide when the sheet applies — no responsive
 * hiding here, because landscape phones are wider than the `sm` breakpoint.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[70] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
        aria-label={`Close ${title}`}
        onClick={onClose}
      />
      <div className="relative max-h-[88svh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl border-t border-charcoal/10 bg-ivory p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] text-charcoal shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-charcoal/50 transition-colors hover:bg-charcoal/5 hover:text-charcoal"
            aria-label={`Close ${title}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

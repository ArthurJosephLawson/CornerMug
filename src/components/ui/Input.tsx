import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className = '', id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name ?? label;
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border bg-white/80 px-3 py-2.5 text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/35 focus:border-lavender focus:ring-2 focus:ring-lavender/40 ${
            icon ? 'pl-9' : ''
          } ${error ? 'border-pink-deep' : 'border-charcoal/10'} ${className}`}
          {...rest}
        />
      </div>
      {error ? (
        <p className="text-xs font-medium text-pink-deep">{error}</p>
      ) : hint ? (
        <p className="text-xs text-charcoal/45">{hint}</p>
      ) : null}
    </div>
  );
});

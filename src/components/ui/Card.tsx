import type { HTMLAttributes, ReactNode } from 'react';

type Tone = 'plain' | 'lavender' | 'pink' | 'butter' | 'sage' | 'powder' | 'peach';

const toneHex: Record<Exclude<Tone, 'plain'>, string> = {
  lavender: '#C8B6FF',
  pink: '#F4ACB7',
  butter: '#FDE49E',
  sage: '#B7E4C7',
  powder: '#BDE0FE',
  peach: '#FFD6BA',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  children: ReactNode;
}

export function Card({ tone = 'plain', className = '', children, style, ...rest }: CardProps) {
  const background = tone === 'plain' ? undefined : `${toneHex[tone]}33`;
  return (
    <div
      className={`rounded-2xl border border-charcoal/5 bg-white/70 p-5 shadow-soft dark:border-white/10 dark:bg-white/5 dark:shadow-none ${className}`}
      style={{ ...style, ...(background ? { backgroundColor: background } : {}) }}
      {...rest}
    >
      {children}
    </div>
  );
}

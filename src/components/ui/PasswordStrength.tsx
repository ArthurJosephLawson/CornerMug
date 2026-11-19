interface PasswordStrengthProps {
  value: string;
  className?: string;
}

export interface PasswordScore {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  hint: string;
}

/**
 * Lightweight strength estimate. Length dominates, with bonuses for mixed
 * case, digits and symbols. Purely local; nothing is sent anywhere.
 */
export function scorePassword(value: string): PasswordScore {
  if (!value) {
    return { score: 0, label: 'Empty', color: '#D9D4CC', hint: 'At least 8 characters.' };
  }

  let points = 0;
  if (value.length >= 8) points += 1;
  if (value.length >= 12) points += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) points += 1;
  if (/\d/.test(value)) points += 1;
  if (/[^A-Za-z0-9]/.test(value)) points += 1;

  if (value.length < 8) {
    return {
      score: 1,
      label: 'Too short',
      color: '#E58CA0',
      hint: 'Use at least 8 characters (32 max).',
    };
  }

  if (points <= 2) {
    return {
      score: 2,
      label: 'Fair',
      color: '#F0CE6B',
      hint: 'Add capitals, numbers or a symbol to strengthen it.',
    };
  }
  if (points === 3) {
    return {
      score: 3,
      label: 'Good',
      color: '#8CCBA0',
      hint: 'Solid. A longer phrase makes it even safer.',
    };
  }
  return {
    score: 4,
    label: 'Strong',
    color: '#6BBF8A',
    hint: 'Nice — this is a strong password.',
  };
}

export function PasswordStrength({ value, className = '' }: PasswordStrengthProps) {
  const result = scorePassword(value);

  return (
    <div className={className}>
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ backgroundColor: result.score >= step ? result.color : '#1E1E2414' }}
          />
        ))}
      </div>
      <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs" role="status">
        <span className="font-semibold" style={{ color: result.color }}>
          {result.label}
        </span>
        <span className="text-charcoal/45">{result.hint}</span>
      </p>
    </div>
  );
}

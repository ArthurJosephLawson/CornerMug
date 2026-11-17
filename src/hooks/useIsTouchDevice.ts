import { useMemo } from 'react';

/**
 * True when the primary pointer is coarse (phones, tablets). Used to swap
 * keyboard-only controls for the touch joystick and tap buttons.
 */
export function useIsTouchDevice(): boolean {
  return useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches,
    [],
  );
}

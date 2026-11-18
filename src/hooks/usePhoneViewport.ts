import { useEffect, useState } from 'react';

export interface PhoneViewport {
  /** True on phones: coarse pointer and a short screen edge. */
  isPhone: boolean;
  /** Portrait orientation of the current viewport. */
  isPortrait: boolean;
}

function readViewport(): PhoneViewport {
  if (typeof window === 'undefined') return { isPhone: false, isPortrait: false };

  const coarse =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    // Landscape phones are wider than the `sm` breakpoint, so Tailwind's
    // responsive classes cannot detect them. The short edge can.
    isPhone: coarse && Math.min(width, height) <= 620,
    isPortrait: height > width,
  };
}

/**
 * Viewport descriptor for the full-screen phone game layout. Reacts to
 * rotation, browser chrome resizing and pointer changes.
 */
export function usePhoneViewport(): PhoneViewport {
  const [viewport, setViewport] = useState<PhoneViewport>(readViewport);

  useEffect(() => {
    const update = () => setViewport(readViewport());
    update();

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    const media = window.matchMedia('(pointer: coarse)');
    media.addEventListener?.('change', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      media.removeEventListener?.('change', update);
    };
  }, []);

  return viewport;
}

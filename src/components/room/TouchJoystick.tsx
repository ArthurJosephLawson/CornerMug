import { useCallback, useRef, useState } from 'react';
import type { InputAxis } from '@/engine/core/InputController';

const DEAD_ZONE = 6;

export interface TouchJoystickProps {
  onAxis: (axis: InputAxis) => void;
  /** Outer diameter in CSS pixels. */
  size?: number;
}

/**
 * On-screen thumbstick for touch devices. Reports a normalized axis with a
 * small dead zone; magnitude is clamped to 1 so it matches keyboard input.
 */
export function TouchJoystick({ onAxis, size = 128 }: TouchJoystickProps) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const radius = Math.max(24, size / 2 - 16);
  const knobSize = Math.round(size * 0.375);

  const apply = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      if (Math.hypot(dx, dy) < DEAD_ZONE) {
        dx = 0;
        dy = 0;
      }
      const scale = Math.min(1, radius / Math.max(Math.hypot(dx, dy), 1));
      const nx = (dx * scale) / radius;
      const ny = (dy * scale) / radius;
      onAxis({ x: nx, y: ny });
      setKnob({ x: nx * radius, y: ny * radius });
    },
    [onAxis, radius],
  );

  const release = useCallback(() => {
    activeRef.current = false;
    setKnob({ x: 0, y: 0 });
    onAxis({ x: 0, y: 0 });
  }, [onAxis]);

  return (
    <div
      ref={baseRef}
      aria-label="Movement joystick"
      className="pointer-events-auto relative touch-none rounded-full border border-ivory/25 bg-charcoal/55 shadow-card backdrop-blur"
      style={{ width: size, height: size }}
      onPointerDown={(event) => {
        activeRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        apply(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (activeRef.current) apply(event.clientX, event.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full bg-ivory/85 shadow-card"
        style={{
          width: knobSize,
          height: knobSize,
          transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
        }}
      />
    </div>
  );
}

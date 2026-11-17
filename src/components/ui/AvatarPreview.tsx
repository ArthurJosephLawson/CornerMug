import { useEffect, useRef, useState } from 'react';
import { AssetLoader } from '@/engine/assets/AssetLoader';
import type { CharacterSlug } from '@/types/engine.types';

const sharedLoader = new AssetLoader();

const fallbackColors: Record<CharacterSlug, string> = {
  resident: '#C8B6FF',
  barista: '#F4ACB7',
  cook: '#FDE49E',
  courier: '#BDE0FE',
  'maintenance-worker': '#FFD6BA',
  'office-worker': '#B7E4C7',
};

export interface AvatarPreviewProps {
  slug: CharacterSlug;
  size?: number;
  className?: string;
  label?: string;
}

/** Renders the first idle-south frame of a character sheet on a small canvas. */
export function AvatarPreview({ slug, size = 64, className = '', label }: AvatarPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    sharedLoader
      .loadSheet(slug)
      .then((sheet) => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;
        const frame = sheet.clips.idle_south?.frames[0];
        if (!frame) return;
        context.imageSmoothingEnabled = false;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(sheet.image, frame.x, frame.y, frame.w, frame.h, 0, 0, size, size);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, size]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl font-bold text-charcoal ${className}`}
        style={{ width: size, height: size, backgroundColor: fallbackColors[slug] }}
        aria-label={label ?? slug}
      >
        {(label ?? slug).slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated', width: size, height: size }}
      aria-label={label ?? slug}
    />
  );
}

import { Coffee } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-charcoal/5 bg-ivory-deep/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-5 text-center text-xs text-charcoal/50 sm:flex-row sm:justify-between sm:text-left">
        <p className="flex items-center gap-1.5">
          <Coffee className="h-3.5 w-3.5" />
          CornerMug — a quiet place to study and hang out.
        </p>
        <p>Pixel art by HappyHustle · Modern Rooms &amp; People v0.2.0</p>
      </div>
    </footer>
  );
}

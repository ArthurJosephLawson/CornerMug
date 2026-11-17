import { Coffee, FileText, Palette, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function CreditsPoliciesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Credits &amp; policies</h1>
        <p className="mt-1 text-sm text-charcoal/55">Who made the art, and how your data is handled.</p>
      </div>

      <Card tone="butter">
        <div className="flex items-start gap-3">
          <Palette className="mt-1 h-5 w-5 shrink-0 text-charcoal/50" />
          <div className="space-y-2 text-sm leading-relaxed text-charcoal/70">
            <h2 className="font-bold text-charcoal">Art assets</h2>
            <p>
              Pixel art: <strong>Modern Rooms &amp; People v0.2.0</strong> by{' '}
              <strong>HappyHustle</strong>. Characters, tiles, props, and the included palette
              come from that pack. See <code className="rounded bg-charcoal/5 px-1">public/sprites/LICENSE.txt</code>{' '}
              for the asset license and <code className="rounded bg-charcoal/5 px-1">credits.txt</code> for
              attribution details.
            </p>
          </div>
        </div>
      </Card>

      <Card tone="powder">
        <div className="flex items-start gap-3">
          <Coffee className="mt-1 h-5 w-5 shrink-0 text-charcoal/50" />
          <div className="space-y-2 text-sm leading-relaxed text-charcoal/70">
            <h2 className="font-bold text-charcoal">Development</h2>
            <p>
              CornerMug is designed and developed by <strong>Arthur Joseph Lawson</strong>{' '}
              <span className="text-charcoal/50">[@monk_mango]</span> for{' '}
              <strong>Scriptmonks</strong>.
            </p>
            <p>
              Built with React, Vite, TypeScript, Tailwind CSS, and Supabase. It runs entirely in
              the browser; multiplayer uses Supabase Realtime broadcast channels.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card tone="sage">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-charcoal/50" />
            <div className="space-y-2 text-sm leading-relaxed text-charcoal/70">
              <h2 className="font-bold text-charcoal">Privacy policy</h2>
              <ul className="list-disc space-y-1 pl-4">
                <li>We store your email, username, generated user key, avatar, and study stats.</li>
                <li>Your email and user key are never shown to other players.</li>
                <li>Friends only see your username, avatar, and approximate last-seen time.</li>
                <li>You can remove friends and delete your account data at any time.</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card tone="pink">
          <div className="flex items-start gap-3">
            <FileText className="mt-1 h-5 w-5 shrink-0 text-charcoal/50" />
            <div className="space-y-2 text-sm leading-relaxed text-charcoal/70">
              <h2 className="font-bold text-charcoal">Terms of service</h2>
              <ul className="list-disc space-y-1 pl-4">
                <li>Be kind. Harassment, hate speech, and spam are not welcome.</li>
                <li>Do not share personal information in public rooms.</li>
                <li>Rooms and chat are best-effort; no uptime guarantee.</li>
                <li>Use the feedback form to report issues or request features.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
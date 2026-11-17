import { useState } from 'react';
import { Check, Copy, LogOut, Volume2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { CHARACTERS } from '@/config/sprites.config';
import { AvatarPreview } from '@/components/ui/AvatarPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-charcoal/50">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-sage-deep' : 'bg-charcoal/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { profile, setAvatar, signOut } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [copied, setCopied] = useState(false);

  if (!profile) return null;

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(profile.user_key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-charcoal/55">Account, character, and comfort preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card tone="powder">
          <div className="flex items-center gap-4">
            <AvatarPreview slug={profile.avatar_slug} size={64} className="rounded-2xl" />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{profile.username}</p>
              <p className="truncate text-xs text-charcoal/50">{profile.email}</p>
              <button
                type="button"
                onClick={copyKey}
                className="mt-2 flex items-center gap-1.5 rounded-full bg-charcoal/5 px-2.5 py-1 font-mono text-xs hover:bg-charcoal/10"
              >
                {profile.user_key}
                {copied ? <Check className="h-3 w-3 text-sage-deep" /> : <Copy className="h-3 w-3 text-charcoal/40" />}
              </button>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal/50">
              Choose your character
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {CHARACTERS.map((character) => (
                <button
                  key={character.slug}
                  type="button"
                  onClick={() => void setAvatar(character.slug)}
                  className={`rounded-xl border p-1.5 transition-all ${
                    profile.avatar_slug === character.slug
                      ? 'border-lavender-deep bg-lavender/30'
                      : 'border-charcoal/10 hover:border-charcoal/25'
                  }`}
                  aria-label={`Use ${character.name}`}
                >
                  <AvatarPreview slug={character.slug} size={44} className="mx-auto rounded-lg" />
                  <p className="mt-1 truncate text-center text-[9px] font-semibold text-charcoal/55">
                    {character.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card tone="sage">
          <div className="mb-2 flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-charcoal/50" />
            <h2 className="font-bold">Comfort</h2>
          </div>
          <div className="divide-y divide-charcoal/5">
            <ToggleRow
              label="Ambient audio"
              description="Allow rain and café hum playback."
              checked={settings.ambientAudio}
              onChange={(next) => updateSettings({ ambientAudio: next })}
            />
            <ToggleRow
              label="UI chimes"
              description="Soft confirmation sounds in the interface."
              checked={settings.uiChimes}
              onChange={(next) => updateSettings({ uiChimes: next })}
            />
            <ToggleRow
              label="Show online status"
              description="Let friends see when you are around."
              checked={settings.showOnlineStatus}
              onChange={(next) => updateSettings({ showOnlineStatus: next })}
            />
            <ToggleRow
              label="Show active room"
              description="Let friends see which room you are in."
              checked={settings.showActiveRoom}
              onChange={(next) => updateSettings({ showActiveRoom: next })}
            />
          </div>
        </Card>
      </div>

      <Button variant="danger" onClick={() => void signOut()}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}
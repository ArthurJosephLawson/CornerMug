import { useState, type FormEvent } from 'react';
import { Check, Copy, Eye, EyeOff, Lock, LogOut, Moon, Volume2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { CHARACTERS } from '@/config/sprites.config';
import { AvatarPreview } from '@/components/ui/AvatarPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { showToast } from '@/hooks/useToast';

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
        <p className="text-sm font-semibold text-charcoal dark:text-[#f4f1ea]">{label}</p>
        <p className="text-xs text-charcoal/50 dark:text-white/55">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-sage-deep' : 'bg-charcoal/15 dark:bg-white/20'
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
  const { profile, setAvatar, signOut, changePassword } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [copied, setCopied] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);

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

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (passwordBusy) return;
    if (newPassword.trim().length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('The new passwords do not match.', 'error');
      return;
    }

    setPasswordBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated. Use it next time you sign in.', 'success');
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Could not change password.', 'error');
    } finally {
      setPasswordBusy(false);
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
                title="Copy password"
              >
                <Lock className="h-3 w-3 text-charcoal/40" />
                ••••••••
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
            <Moon className="h-4 w-4 text-charcoal/50" />
            <h2 className="font-bold">Appearance & Comfort</h2>
          </div>
          <div className="divide-y divide-charcoal/5 dark:divide-white/10">
            <ToggleRow
              label="Dark mode"
              description="Use a darker, flat theme across the site."
              checked={settings.darkMode}
              onChange={(next) => updateSettings({ darkMode: next })}
            />
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

      <Card tone="butter">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-charcoal/50" />
            <div>
              <h2 className="font-bold">Password</h2>
              <p className="text-xs text-charcoal/50">
                Replace the password you were given with one you choose.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Current password"
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              autoComplete="current-password"
              autoCapitalize="none"
              spellCheck={false}
            />
            <Input
              label="New password"
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
              maxLength={32}
              autoComplete="new-password"
              autoCapitalize="none"
              spellCheck={false}
              action={
                <button
                  type="button"
                  onClick={() => setShowPasswords((value) => !value)}
                  className="rounded-lg p-1.5 text-charcoal/45 transition-colors hover:bg-charcoal/5 hover:text-charcoal"
                  aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                  aria-pressed={showPasswords}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </div>

          <PasswordStrength value={newPassword} />

          <Input
            label="Confirm new password"
            type={showPasswords ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            autoComplete="new-password"
            autoCapitalize="none"
            spellCheck={false}
            error={
              confirmPassword && confirmPassword !== newPassword
                ? 'Passwords do not match.'
                : undefined
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-charcoal/45">8–32 characters. This becomes your sign-in password.</p>
            <Button type="submit" loading={passwordBusy}>
              <Lock className="h-4 w-4" /> Update password
            </Button>
          </div>
        </form>
      </Card>

      <Button variant="danger" onClick={() => void signOut()}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}
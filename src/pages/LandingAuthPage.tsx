import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Coffee, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CHARACTERS } from '@/config/sprites.config';
import type { CharacterSlug } from '@/types/engine.types';
import { AvatarPreview } from '@/components/ui/AvatarPreview';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Mode = 'signin' | 'signup';

interface LocationState {
  from?: string;
}

export function LandingAuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as LocationState | null)?.from ?? '/';

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [userKey, setUserKey] = useState('');
  const [avatar, setAvatar] = useState<CharacterSlug>('resident');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') {
        await signUp(email, username, avatar);
      } else {
        await signIn(email, username, userKey);
      }
      navigate(redirectTo, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4 py-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-charcoal/5 bg-white/70 shadow-card md:grid-cols-2">
        <div className="flex flex-col justify-between gap-6 bg-charcoal p-8 text-ivory">
          <div>
            <div className="flex items-center gap-2 font-display text-xl font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lavender text-charcoal">
                <Coffee className="h-5 w-5" />
              </span>
              CornerMug
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ivory/70">
              A quiet pixel-art café for study sessions and low-pressure hangouts.
              Pick a character, grab a seat, and stay a while.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {CHARACTERS.map((character) => (
              <button
                key={character.slug}
                type="button"
                onClick={() => setAvatar(character.slug)}
                className={`rounded-2xl border p-2 transition-all ${
                  avatar === character.slug
                    ? 'border-lavender bg-lavender/20'
                    : 'border-white/10 bg-white/5 hover:border-white/25'
                }`}
                aria-label={`Choose ${character.name}`}
              >
                <AvatarPreview slug={character.slug} size={56} className="mx-auto rounded-xl" />
                <p className="mt-1 text-center text-[10px] font-semibold text-ivory/70">{character.name}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          <div className="flex rounded-full bg-charcoal/5 p-1 text-sm font-semibold">
            {(['signin', 'signup'] as Mode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => switchMode(option)}
                className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
                  mode === option ? 'bg-white shadow-soft' : 'text-charcoal/55 hover:text-charcoal'
                }`}
              >
                {option === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="h-4 w-4" />}
              autoComplete="email"
            />
            <Input
              label="Permanent username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="quietfox"
              icon={<User className="h-4 w-4" />}
              maxLength={24}
            />
            {mode === 'signin' ? (
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={userKey}
                onChange={(event) => setUserKey(event.target.value)}
                placeholder="Your password"
                icon={<Lock className="h-4 w-4" />}
                hint="Your generated key, or a password you set in Settings."
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                action={
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="rounded-lg p-1.5 text-charcoal/45 transition-colors hover:bg-charcoal/5 hover:text-charcoal"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            ) : (
              <p className="rounded-xl bg-butter/40 px-3 py-2 text-xs leading-relaxed text-charcoal/70">
                We generate a password for you. Keep it somewhere safe — it is how you sign back
                in on other devices. You can replace it with your own password in Settings.
              </p>
            )}

            {error ? (
              <p className="rounded-xl border border-pink-deep/30 bg-pink/30 px-3 py-2 text-xs font-medium text-charcoal">
                {error}
              </p>
            ) : null}

            <Button type="submit" loading={busy} className="w-full">
              {mode === 'signin' ? 'Enter CornerMug' : 'Create my password'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

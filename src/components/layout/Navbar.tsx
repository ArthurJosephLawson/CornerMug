import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Coffee, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AvatarPreview } from '@/components/ui/AvatarPreview';

export function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/friends', label: 'Friends' },
    { to: '/settings', label: 'Settings' },
    { to: '/info', label: 'Info & Feedback' },
    { to: '/credits', label: 'Credits' },
    ...(profile?.is_admin ? [{ to: '/admin', label: 'Admin', end: false }] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-charcoal text-ivory shadow-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lavender text-charcoal">
            <Coffee className="h-4 w-4" />
          </span>
          CornerMug
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm font-medium">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 transition-colors ${
                  isActive ? 'bg-lavender text-charcoal' : 'text-ivory/70 hover:bg-white/10 hover:text-ivory'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {profile ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold leading-tight">{profile.username}</p>
              <p className="text-[10px] uppercase tracking-wide text-ivory/50">{profile.user_key}</p>
            </div>
            <AvatarPreview slug={profile.avatar_slug} size={32} className="rounded-lg" />
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full p-2 text-ivory/60 transition-colors hover:bg-white/10 hover:text-ivory"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

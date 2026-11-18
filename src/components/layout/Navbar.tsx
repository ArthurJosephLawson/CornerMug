import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  Coffee,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AvatarPreview } from '@/components/ui/AvatarPreview';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/friends', label: 'Friends', icon: Users },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/info', label: 'Info & Feedback', icon: Info },
    { to: '/credits', label: 'Credits', icon: Award },
    ...(profile?.is_admin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  // Navigating away closes the phone menu, including history/back gestures.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-charcoal text-ivory shadow-card">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:py-3">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight"
          onClick={() => setMenuOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lavender text-charcoal">
            <Coffee className="h-4 w-4" />
          </span>
          CornerMug
        </Link>

        <nav className="hidden flex-1 flex-wrap items-center gap-1 text-sm font-medium sm:flex">
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

        <div className="ml-auto flex items-center gap-2">
          {profile ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold leading-tight">{profile.username}</p>
                <p className="text-[10px] uppercase tracking-wide text-ivory/50">{profile.user_key}</p>
              </div>
              <AvatarPreview slug={profile.avatar_slug} size={32} className="rounded-lg" />
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden rounded-full p-2 text-ivory/60 transition-colors hover:bg-white/10 hover:text-ivory sm:inline-flex"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-ivory transition-colors active:bg-white/20 sm:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="mobile-nav"
          className="max-h-[calc(100svh-3.5rem)] overflow-y-auto overscroll-contain border-t border-white/10 px-3 pb-3 pt-2 sm:hidden"
        >
          <nav className="grid gap-0.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-lavender text-charcoal'
                        : 'text-ivory/75 active:bg-white/10 active:text-ivory'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          {profile ? (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{profile.username}</p>
                <p className="truncate text-[10px] uppercase tracking-wide text-ivory/50">
                  {profile.user_key}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-ivory active:bg-white/20"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarDays, Siren, ClipboardList, Pill, Stethoscope, Network,
  BarChart3, Settings, LogOut, Menu, X, HeartPulse, Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../utils/permissions';

const ICONS = { LayoutDashboard, Users, CalendarDays, Siren, ClipboardList, Pill, Stethoscope, Network, BarChart3, Settings, Building2 };

function Brand({ compact }) {
  return (
    <div className={`flex items-center gap-2.5 ${compact ? 'justify-center' : ''}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white"><HeartPulse className="h-5 w-5" aria-hidden="true" /></span>
      <span className={compact ? 'hidden lg:block' : ''}>
        <span className="block text-[15px] font-bold leading-tight">Patient Records</span>
        <span className="block text-xs text-muted">DSA-II PBL project</span>
      </span>
    </div>
  );
}

function NavList({ items, onNavigate, onLogout, compact }) {
  return (
    <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2 py-3">
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li key={item.to}>
              <NavLink to={item.to} onClick={onNavigate} title={item.label}
                className={({ isActive }) => `flex min-h-[42px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${compact ? 'justify-center lg:justify-start' : ''} ${isActive ? 'bg-brand-600 text-white' : 'text-ink hover:bg-brand-50'}`}>
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span className={compact ? 'hidden lg:inline' : ''}>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
        <li>
          <button onClick={onLogout} title="Logout"
            className={`flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-critical hover:bg-critical-soft ${compact ? 'justify-center lg:justify-start' : ''}`}>
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <span className={compact ? 'hidden lg:inline' : ''}>Logout</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(user.role));

  useEffect(() => { setOpen(false); }, [location.pathname]); // close the drawer after navigating
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="min-h-screen bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">Skip to content</a>

      {/* Tablet (icons only) + desktop (full) sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r border-line bg-white md:flex lg:w-64">
        <div className="border-b border-line px-3 py-4 lg:px-4"><Brand compact /></div>
        <NavList items={items} onLogout={handleLogout} compact />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <Brand />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-muted hover:bg-canvas"><X className="h-5 w-5" /></button>
            </div>
            <NavList items={items} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="md:pl-16 lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-2.5 backdrop-blur md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="rounded-lg p-2 text-ink hover:bg-canvas"><Menu className="h-5 w-5" /></button>
            <span className="font-bold">Patient Records</span>
          </div>
          <p className="hidden text-sm text-muted md:block">Intelligent Patient Record Management System</p>
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="text-xs capitalize text-muted">{user.role}</p>
            </div>
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">{user.name.charAt(0).toUpperCase()}</span>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

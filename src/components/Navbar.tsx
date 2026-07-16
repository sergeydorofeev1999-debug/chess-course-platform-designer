'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Menu, X, Home, BookOpen, LayoutDashboard, Settings, LogIn, LogOut } from 'lucide-react';

interface NavbarProps {
  isAdmin: boolean;
  isCoach: boolean;
}

export default function Navbar({ isAdmin, isCoach }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    }).catch(() => {});
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const navLinks = [
    { href: '/', label: 'Главная', icon: Home },
    { href: '/courses', label: 'Курсы', icon: BookOpen },
  ];

  return (
    <nav className="navbar">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-[56px]">
        <Link href="/" className="font-bold tracking-tight flex items-center gap-2">
          <span className="text-xl">♟️</span>
          <span className="hidden sm:inline">Chess Progress</span>
        </Link>

        <div className="hidden md:flex gap-1 text-sm items-center">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg opacity-60 hover:opacity-100 transition-all duration-150"
              style={{ color: 'var(--text-primary)' }}
            >
              {label}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg opacity-60 hover:opacity-100 transition-all duration-150"
                style={{ color: 'var(--text-primary)' }}
              >
                Кабинет
              </Link>
              {isCoach && (
                <Link
                  href="/coach"
                  className="px-3 py-1.5 rounded-lg opacity-60 hover:opacity-100 transition-all duration-150"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Тренер
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-lg transition-all duration-150"
                  style={{ color: 'var(--accent)' }}
                >
                  Админ
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg opacity-50 hover:opacity-80 transition-all duration-150 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                <LogOut size={14} />
                <span>Выйти</span>
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="btn btn-primary flex items-center gap-1.5 ml-1"
            >
              <LogIn size={15} />
              Войти
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-1 rounded-lg transition"
          style={{ color: 'var(--text-primary)' }}
          aria-label="Открыть меню"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden px-4 py-3 space-y-1 text-sm"
          style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--surface-border)' }}
        >
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 py-2 px-3 rounded-lg transition"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setOpen(false)}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 py-2 px-3 rounded-lg transition"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard size={16} /> Кабинет
              </Link>
              {isCoach && (
                <Link
                  href="/coach"
                  className="flex items-center gap-3 py-2 px-3 rounded-lg transition"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => setOpen(false)}
                >
                  <BookOpen size={16} /> Тренер
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 py-2 px-3 rounded-lg transition"
                  style={{ color: 'var(--accent)' }}
                  onClick={() => setOpen(false)}
                >
                  <Settings size={16} /> Админ
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 py-2 px-3 rounded-lg transition w-full text-left"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <LogOut size={16} /> Выйти
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="btn btn-primary flex items-center gap-3 py-2 px-3 rounded-lg transition"
              onClick={() => setOpen(false)}
            >
              <LogIn size={16} /> Войти
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

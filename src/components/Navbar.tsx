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
    }).catch((error) => {
      console.error('Failed to get user:', error);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.reload();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const navLinks = [
    { href: '/', label: 'Главная', icon: Home },
    { href: '/courses', label: 'Курсы', icon: BookOpen },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#1A1816]/95 backdrop-blur-md border-b border-[#3D3A37]/40">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-[56px]">
        <Link href="/" className="font-bold text-[#F9F8F6] tracking-tight flex items-center gap-2">
          <span className="text-xl">♟️</span>
          <span className="hidden sm:inline">Chess Progress</span>
        </Link>

        <div className="hidden md:flex gap-1 text-sm items-center">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg text-[#9E9892] hover:text-[#F5F0EB] hover:bg-[#3D3A37]/30 transition-all duration-150"
            >
              {label}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg text-[#9E9892] hover:text-[#F5F0EB] hover:bg-[#3D3A37]/30 transition-all duration-150"
              >
                Кабинет
              </Link>
              {isCoach && (
                <Link
                  href="/coach"
                  className="px-3 py-1.5 rounded-lg text-[#9E9892] hover:text-[#F5F0EB] hover:bg-[#3D3A37]/30 transition-all duration-150"
                >
                  Тренер
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-lg text-[#C9A84C] hover:text-[#DCC078] hover:bg-[#C9A84C]/10 transition-all duration-150"
                >
                  Админ
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg text-[#9E9892] hover:text-[#F5F0EB] hover:bg-[#3D3A37]/30 transition-all duration-150 text-sm"
              >
                <LogOut size={14} />
                <span>Выйти</span>
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-1.5 ml-1 bg-[#C9A84C] hover:bg-[#DCC078] text-[#1A1816] px-4 py-1.5 rounded-lg font-semibold transition-all duration-200 shadow-[0_2px_0_rgba(26,24,22,0.15)] hover:-translate-y-px hover:shadow-[0_4px_0_rgba(26,24,22,0.12)] active:translate-y-0 active:shadow-none"
            >
              <LogIn size={15} />
              Войти
            </Link>
          )}
        </div>

        <button
          className="md:hidden text-[#F5F0EB] p-1 rounded-lg hover:bg-[#3D3A37]/30 transition"
          aria-label="Открыть меню"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden border-t border-[#3D3A37]/30 bg-[#1A1816]/98 backdrop-blur-md px-4 py-3 space-y-1 text-sm">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 py-2 px-3 rounded-lg text-[#9E9892] hover:text-[#F5F0EB] hover:bg-[#3D3A37]/30 transition"
              onClick={() => setOpen(false)}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 py-2 px-3 rounded-lg text-[#9E9892] hover:text-[#F5F0EB] hover:bg-[#3D3A37]/30 transition"
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard size={16} /> Кабинет
              </Link>
              {isCoach && (
                <Link
                  href="/coach"
                  className="flex items-center gap-3 py-2 px-3 rounded-lg text-[#9E9892] hover:text-[#F5F0EB] hover:bg-[#3D3A37]/30 transition"
                  onClick={() => setOpen(false)}
                >
                  <BookOpen size={16} /> Тренер
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 py-2 px-3 rounded-lg text-[#C9A84C] hover:text-[#DCC078] hover:bg-[#C9A84C]/10 transition"
                  onClick={() => setOpen(false)}
                >
                  <Settings size={16} /> Админ
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 py-2 px-3 rounded-lg text-[#9E9892] hover:text-red-400 hover:bg-red-500/10 transition w-full text-left"
              >
                <LogOut size={16} /> Выйти
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-3 py-2 px-3 rounded-lg text-[#C9A84C] hover:text-[#DCC078] hover:bg-[#C9A84C]/10 transition"
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

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  GraduationCap, Home, Code2, CalendarCheck, Wallet, Settings, Search,
  ListChecks, CheckSquare, Rocket, Sun, Moon,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Módulos', match: (p) => p === '/' },
  { href: '/ide', icon: Code2, label: 'IDE' },
  { href: '/report', icon: CalendarCheck, label: 'Relatório' },
  { href: '/financeiro', icon: Wallet, label: 'Financeiro' },
  { href: '/checklist-semanal', icon: CheckSquare, label: 'Checklist' },
  { href: '/empreender', icon: Rocket, label: 'Empreender' },
  { href: '/lembretes', icon: ListChecks, label: 'Lembretes' },
  { href: '/admin', icon: Settings, label: 'Gerenciar' },
  { href: '/search', icon: Search, label: 'Buscar' },
];

function NavLink({ href, icon: Icon, label, active }) {
  return (
    <Link
      href={href}
      title={label}
      className={`group relative flex items-center gap-1.5 shrink-0 text-sm px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
        active
          ? 'bg-[var(--accent)] text-white shadow-[0_4px_14px_-4px_rgba(99,102,241,0.5)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
      }`}
    >
      <Icon size={17} strokeWidth={2} className="shrink-0" />
      {/* Os rótulos só entram quando há largura de sobra: com nove itens eles
          empurrariam o menu para fora da tela entre 640px e 1280px. */}
      <span className="hidden 2xl:inline">{label}</span>
    </Link>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
  }, []);

  const trocar = () => {
    const proximo = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', proximo);
    try { localStorage.setItem('nichole_theme', proximo); } catch (e) { /* modo privado */ }
    setTheme(proximo);
  };

  const label = theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro';

  return (
    <button
      onClick={trocar}
      title={label}
      aria-label={label}
      className="ml-1 w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200"
    >
      {theme === 'dark' ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
    </button>
  );
}

export default function Layout({ children }) {
  const router = useRouter();
  const isActive = (item) =>
    item.match ? item.match(router.pathname) : router.pathname.includes(item.href);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-2">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)] text-white">
                <GraduationCap size={18} strokeWidth={2.2} />
              </span>
              {/* O nome só aparece quando sobra largura: com nove abas ele
                  roubaria o espaço dos ícones nas telas médias. */}
              <span className="font-semibold text-[15px] tracking-tight hidden lg:inline whitespace-nowrap">
                Plataforma da Nichole
              </span>
            </Link>

            {/* Em tela estreita o menu rola na horizontal em vez de empurrar
                a página inteira para fora. */}
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 overflow-x-auto no-scrollbar">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} {...item} active={isActive(item)} />
              ))}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-5 text-center text-sm text-[var(--text-secondary)]">
        <p>Plataforma de Estudo da Nichole — © 2026</p>
      </footer>
    </div>
  );
}

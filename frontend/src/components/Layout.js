import Link from 'next/link';
import { useRouter } from 'next/router';
import { GraduationCap, Home, Code2, CalendarCheck, Wallet, Settings, Search, ListChecks } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Módulos', match: (p) => p === '/' },
  { href: '/ide', icon: Code2, label: 'IDE' },
  { href: '/report', icon: CalendarCheck, label: 'Relatório' },
  { href: '/financeiro', icon: Wallet, label: 'Financeiro' },
  { href: '/lembretes', icon: ListChecks, label: 'Lembretes' },
  { href: '/admin', icon: Settings, label: 'Gerenciar' },
  { href: '/search', icon: Search, label: 'Buscar' },
];

function NavLink({ href, icon: Icon, label, active }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-1.5 text-sm px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
        active
          ? 'bg-[var(--accent)] text-white shadow-[0_4px_14px_-4px_rgba(99,102,241,0.5)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
      }`}
    >
      <Icon size={17} strokeWidth={2} className="shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
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
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)] text-white">
                <GraduationCap size={18} strokeWidth={2.2} />
              </span>
              <span className="font-semibold text-[15px] tracking-tight hidden sm:inline">
                Plataforma da Nichole
              </span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-1.5">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} {...item} active={isActive(item)} />
              ))}
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

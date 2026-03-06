'use client';

/**
 * Navbar.tsx — Barra di navigazione fissa, responsive mobile
 *
 * Su desktop: logo | mini-searchbar | link + profilo
 * Su mobile:  logo | bottone profilo | bottone hamburger
 *             → menu a tendina con link di navigazione
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfilePopup } from './ProfilePopup';

interface NavbarProps {
  onFilterOpen: () => void;
  heroSearchbarRef: React.RefObject<HTMLDivElement | null>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  activeFilterCount: number;
}

const NAV_LINKS = [
  { label: 'Carte', href: '/cards' },
  { label: 'Mazzi', href: '/decks' },
  { label: 'Community', href: '/community' },
];

export function Navbar({
  onFilterOpen,
  heroSearchbarRef,
  searchValue,
  onSearchChange,
  activeFilterCount,
}: NavbarProps) {
  const [denser, setDenser] = useState(false);
  const [showNavSearch, setShowNavSearch] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // menu hamburger mobile
  const router = useRouter();

  const handleSearch = () => {
    const q = searchValue.trim();
    setMenuOpen(false);
    router.push(q ? `/cards?q=${encodeURIComponent(q)}` : '/cards');
  };

  useEffect(() => {
    const handleScroll = () => {
      setDenser(window.scrollY > 10);
      if (heroSearchbarRef.current) {
        const rect = heroSearchbarRef.current.getBoundingClientRect();
        setShowNavSearch(rect.bottom < 66 + 10);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [heroSearchbarRef]);

  // Chiude il menu mobile se si ruota/ridimensiona verso desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 640) setMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          height: 'var(--navbar-h)',
          background: denser ? 'rgba(10,12,16,0.88)' : 'rgba(10,12,16,0.65)',
          backdropFilter: 'blur(32px) saturate(165%)',
          WebkitBackdropFilter: 'blur(32px) saturate(165%)',
          borderBottom: '1px solid var(--glass-border)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
          transition: 'background 0.3s',
        }}
      >
        {/* Logo */}
        <div
          onClick={() => { setMenuOpen(false); router.push('/'); }}
          style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, var(--gold), #7a4800)', display: 'grid', placeItems: 'center', fontSize: '.85rem', boxShadow: '0 2px 14px rgba(201,168,76,0.38)', flexShrink: 0 }}>
            ⬡
          </div>
          AetherDeck
        </div>

        {/* Mini-searchbar — solo desktop (nascosta su mobile con media query via stile inline + js) */}
        <div
          id="nav-search-desktop"
          style={{
            flex: 1, maxWidth: 420, margin: '0 20px',
            opacity: showNavSearch ? 1 : 0,
            transform: showNavSearch ? 'translateY(0) scale(1)' : 'translateY(-5px) scale(0.97)',
            pointerEvents: showNavSearch ? 'all' : 'none',
            transition: 'opacity .32s cubic-bezier(.22,1,.36,1), transform .32s cubic-bezier(.22,1,.36,1)',
            // Nascosta su mobile tramite CSS class (vedi <style> in fondo)
          }}
          className="nav-search-desktop-wrap"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid var(--glass-border)', borderRadius: 13, padding: '7px 12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '.9rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Cerca una carta…"
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '.86rem', fontFamily: 'var(--font-outfit)', minWidth: 0 }}
            />
            <button onClick={onFilterOpen} style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', borderRadius: 8, background: 'var(--gold-dim)', border: '1px solid rgba(201,168,76,0.28)', color: 'var(--gold)', cursor: 'pointer', flexShrink: 0 }}>
              <FilterIcon size={14} />
            </button>
          </div>
        </div>

        {/* Destra: link desktop + profilo + hamburger mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* Link navigazione — visibili solo su desktop */}
          <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} onClick={() => router.push(href)}
                style={{ padding: '7px 11px', borderRadius: 11, fontSize: '.84rem', fontWeight: 500, color: 'var(--text-dim)', cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap' }}>
                {label}
              </a>
            ))}
          </div>

          {/* Bottone profilo */}
          <button
            onClick={() => { setMenuOpen(false); setProfileOpen(o => !o); }}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              border: profileOpen ? '1.5px solid var(--gold)' : '1.5px solid var(--glass-border)',
              background: profileOpen ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.07)',
              cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: '.95rem',
              boxShadow: profileOpen ? '0 0 0 3px rgba(201,168,76,0.2)' : 'none',
              transition: 'all .2s',
            }}
          >
            👤
          </button>

          {/* Bottone hamburger — visibile solo su mobile */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: menuOpen ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.07)',
              border: `1.5px solid ${menuOpen ? 'rgba(201,168,76,0.4)' : 'var(--glass-border)'}`,
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'all .2s',
            }}
          >
            {/* Le tre linee si trasformano in X quando il menu è aperto */}
            <span style={{ display: 'block', width: 16, height: 1.5, background: menuOpen ? 'var(--gold)' : 'var(--text-dim)', borderRadius: 2, transform: menuOpen ? 'translateY(5.5px) rotate(45deg)' : 'none', transition: 'all .22s' }} />
            <span style={{ display: 'block', width: 16, height: 1.5, background: menuOpen ? 'var(--gold)' : 'var(--text-dim)', borderRadius: 2, opacity: menuOpen ? 0 : 1, transition: 'all .22s' }} />
            <span style={{ display: 'block', width: 16, height: 1.5, background: menuOpen ? 'var(--gold)' : 'var(--text-dim)', borderRadius: 2, transform: menuOpen ? 'translateY(-5.5px) rotate(-45deg)' : 'none', transition: 'all .22s' }} />
          </button>
        </div>
      </nav>

      {/* Menu mobile a tendina */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed', top: 'var(--navbar-h)', left: 0, right: 0,
            zIndex: 190,
            background: 'rgba(10,12,16,0.97)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--glass-border)',
            padding: '12px 16px 16px',
            display: 'flex', flexDirection: 'column', gap: 4,
            animation: 'slideDown .22s cubic-bezier(.22,1,.36,1)',
          }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => { setMenuOpen(false); router.push(href); }}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 12, textAlign: 'left',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text)', fontSize: '.92rem', fontWeight: 500,
                fontFamily: 'var(--font-outfit)', cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Overlay per chiudere il menu mobile cliccando fuori */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 180 }} />
      )}

      <ProfilePopup open={profileOpen} onClose={() => setProfileOpen(false)} />
      {profileOpen && (
        <div onClick={() => setProfileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 250 }} />
      )}

      {/* CSS responsive: hamburger visibile solo mobile, link solo desktop */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Desktop: mostra link, nascondi hamburger */
        @media (min-width: 641px) {
          .nav-hamburger { display: none !important; }
        }
        /* Mobile: nascondi link e mini-searchbar, mostra hamburger */
        @media (max-width: 640px) {
          .nav-links-desktop { display: none !important; }
          .nav-search-desktop-wrap { display: none !important; }
        }
      `}</style>
    </>
  );
}

function FilterIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="9" y1="18" x2="15" y2="18" />
    </svg>
  );
}

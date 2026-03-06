/**
 * Navbar.tsx — Barra di navigazione fissa
 *
 * La navbar ha tre comportamenti dinamici legati allo scroll:
 * 1. Diventa più opaca (denser) dopo i primi 10px di scroll
 * 2. Mostra una mini-searchbar quando la searchbar hero esce dallo schermo
 * 3. La mini-searchbar è sincronizzata con quella hero (stesso stato condiviso)
 *
 * NAVIGAZIONE:
 * I link "Carte", "Mazzi", "Community" navigano programmaticamente
 * tramite useRouter. La mini-searchbar naviga verso /cards?q=... al tasto Invio,
 * esattamente come la searchbar nella sezione hero.
 * Cliccando sul logo si torna alla homepage.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfilePopup } from './ProfilePopup';

/**
 * NavbarProps — interfaccia TypeScript per le props della Navbar
 */
interface NavbarProps {
  onFilterOpen: () => void;                                // Apre il FilterPanel
  heroSearchbarRef: React.RefObject<HTMLDivElement | null>;// Ref alla searchbar hero (per lo scroll)
  searchValue: string;                                     // Valore corrente della ricerca
  onSearchChange: (value: string) => void;                 // Aggiorna il valore di ricerca
  activeFilterCount: number;                               // Numero filtri attivi
}

export function Navbar({
  onFilterOpen,
  heroSearchbarRef,
  searchValue,
  onSearchChange,
  activeFilterCount,
}: NavbarProps) {

  // true → la navbar diventa più scura/opaca (dopo 10px di scroll)
  const [denser, setDenser] = useState(false);

  // true → mostra la mini-searchbar nella navbar
  const [showNavSearch, setShowNavSearch] = useState(false);

  // true → il popup di login/profilo è aperto
  const [profileOpen, setProfileOpen] = useState(false);

  /**
   * useRouter — hook Next.js per la navigazione programmatica
   * Usato per navigare cliccando il logo, i link e il tasto Invio nella searchbar.
   */
  const router = useRouter();

  /**
   * handleSearch — naviga verso /cards con il testo cercato
   *
   * Stessa logica della HeroSection: encode il testo per l'URL,
   * naviga su /cards con il parametro ?q=.
   */
  const handleSearch = () => {
    const q = searchValue.trim();
    router.push(q ? `/cards?q=${encodeURIComponent(q)}` : '/cards');
  };

  /**
   * useEffect per l'event listener dello scroll.
   *
   * handleScroll viene chiamata ad ogni evento scroll e:
   * 1. Imposta "denser" se la pagina è scrollata oltre 10px
   * 2. Legge la posizione della searchbar hero con getBoundingClientRect():
   *    se il bordo inferiore è salito sopra la navbar (66px + 10px margine),
   *    mostra la mini-searchbar nella navbar
   *
   * { passive: true } ottimizza lo scroll: il browser sa che non chiameremo
   * preventDefault() e può ottimizzare il rendering.
   *
   * Il cleanup nel return rimuove il listener quando il componente smonta,
   * evitando memory leak.
   */
  useEffect(() => {
    const handleScroll = () => {
      setDenser(window.scrollY > 10);
      if (heroSearchbarRef.current) {
        // getBoundingClientRect() → posizione dell'elemento relativa al viewport
        const rect = heroSearchbarRef.current.getBoundingClientRect();
        // Se il bordo inferiore della searchbar è sopra la navbar → mostrala
        setShowNavSearch(rect.bottom < 66 + 10);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [heroSearchbarRef]);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 200,
          height: 'var(--navbar-h)',
          // Background più opaco quando si è scrollati (denser)
          background: denser ? 'rgba(10,12,16,0.78)' : 'rgba(10,12,16,0.55)',
          backdropFilter: 'blur(32px) saturate(165%) brightness(1.07)',
          WebkitBackdropFilter: 'blur(32px) saturate(165%) brightness(1.07)',
          borderBottom: '1px solid var(--glass-border)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px',
          transition: 'background 0.3s', // Transizione fluida al cambio opacità
        }}
      >

        {/*
          ── Logo ──
          onClick naviga verso la homepage ('/').
          In un'app reale si userebbe <Link href="/"> di Next.js,
          ma router.push() è equivalente per navigazione programmatica.
        */}
        <div
          onClick={() => router.push('/')}
          style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.18rem', fontWeight: 700, color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
        >
          <div style={{ width: 33, height: 33, borderRadius: 9, background: 'linear-gradient(135deg, var(--gold), #7a4800)', display: 'grid', placeItems: 'center', fontSize: '.95rem', boxShadow: '0 2px 14px rgba(201,168,76,0.38)' }}>
            ⬡
          </div>
          AetherDeck
        </div>

        {/*
          ── Mini-searchbar (appare allo scroll) ──
          Sempre nel DOM ma nascosta tramite opacity/transform/pointer-events.
          La transizione CSS crea un fade-in fluido invece di apparire di scatto.
          pointer-events: none quando nascosta → i click la attraversano verso
          gli elementi sottostanti.
        */}
        <div
          style={{
            flex: 1, maxWidth: 460, margin: '0 28px',
            opacity: showNavSearch ? 1 : 0,
            transform: showNavSearch ? 'translateY(0) scale(1)' : 'translateY(-5px) scale(0.97)',
            pointerEvents: showNavSearch ? 'all' : 'none',
            transition: 'opacity .32s cubic-bezier(.22,1,.36,1), transform .32s cubic-bezier(.22,1,.36,1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid var(--glass-border)', borderRadius: 13, padding: '8px 14px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '.9rem' }}>🔍</span>
            {/*
              Input sincronizzato con la searchbar hero:
              - value={searchValue} → usa lo stato del genitore (page.tsx)
              - onChange → aggiorna lo stato condiviso
              - onKeyDown → Invio naviga verso /cards?q=...
            */}
            <input
              type="text"
              placeholder="Cerca una carta…"
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '.86rem', fontFamily: 'var(--font-outfit)' }}
            />
            {/* Bottone filtri compatto per la mini-searchbar */}
            <button
              onClick={onFilterOpen}
              style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'var(--gold-dim)', border: '1px solid rgba(201,168,76,0.28)', color: 'var(--gold)', cursor: 'pointer' }}
            >
              <FilterIcon size={15} />
            </button>
          </div>
        </div>

        {/*
          ── Link di navigazione + bottone profilo ──
          I link usano router.push() per navigare programmaticamente.
          In produzione si userebbero componenti <Link> di Next.js per il
          prefetching automatico delle pagine al hover.
        */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {[
            { label: 'Carte', href: '/cards' },
            { label: 'Mazzi', href: '/decks' },
            { label: 'Community', href: '/community' },
          ].map(({ label, href }) => (
            <a
              key={label}
              onClick={() => router.push(href)}
              style={{ padding: '7px 13px', borderRadius: 11, fontSize: '.84rem', fontWeight: 500, color: 'var(--text-dim)', cursor: 'pointer', transition: 'all .2s' }}
            >
              {label}
            </a>
          ))}

          {/*
            Bottone profilo: apre/chiude il popup di login.
            o => !o è una forma compatta per invertire il valore corrente.
            Lo stile cambia visivamente quando il popup è aperto (bordo dorato, glow).
          */}
          <button
            onClick={() => setProfileOpen(o => !o)}
            style={{
              width: 37, height: 37, borderRadius: '50%',
              border: profileOpen ? '1.5px solid var(--gold)' : '1.5px solid var(--glass-border)',
              background: profileOpen ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.07)',
              cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: '1rem',
              boxShadow: profileOpen ? '0 0 0 3px rgba(201,168,76,0.2)' : 'none',
              transition: 'all .2s',
            }}
          >
            👤
          </button>
        </div>
      </nav>

      {/* Popup di login/registrazione */}
      <ProfilePopup open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/*
        Overlay invisibile dietro il popup:
        cattura i click "fuori" dal popup per chiuderlo.
        Appare solo quando il popup è aperto (rendering condizionale con &&).
      */}
      {profileOpen && (
        <div
          onClick={() => setProfileOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 250 }}
        />
      )}
    </>
  );
}

/**
 * FilterIcon — icona SVG a tre linee orizzontali (simbolo filtri)
 *
 * Componente privato (non esportato fuori dal file).
 * Accetta size come prop opzionale con valore di default 20px.
 * Le tre linee di lunghezza decrescente simboleggiano un filtro/imbuto dall'alto.
 */
function FilterIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /> {/* Linea lunga in alto */}
      <line x1="6" y1="12" x2="18" y2="12" /> {/* Linea media al centro */}
      <line x1="9" y1="18" x2="15" y2="18" /> {/* Linea corta in basso */}
    </svg>
  );
}

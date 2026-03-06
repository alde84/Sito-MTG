/**
 * HeroSection.tsx — Sezione hero della homepage
 *
 * La "hero" è la prima sezione visibile quando si apre il sito.
 * Occupa l'intera altezza dello schermo (min-height: 100vh) e contiene:
 * - Un badge animato con informazioni sulla piattaforma
 * - Il titolo principale (H1) con effetto gradiente
 * - Un sottotitolo descrittivo
 * - La searchbar principale con filtri integrati
 * - Un indicatore "scorri" in basso
 *
 * NAVIGAZIONE:
 * Quando l'utente preme "Cerca" o il tasto Invio, viene reindirizzato
 * alla pagina /cards con il testo cercato come parametro URL (?q=...).
 * Questo permette di condividere i link di ricerca e di mantenere
 * la cronologia del browser funzionante (tasto indietro).
 */
'use client';

import { useRouter } from 'next/navigation';

/**
 * HeroSectionProps — interfaccia per le props di HeroSection
 */
interface HeroSectionProps {
  searchValue: string;                                   // Testo attuale nella searchbar
  onSearchChange: (value: string) => void;               // Aggiorna il testo di ricerca
  onFilterOpen: () => void;                              // Apre il pannello filtri
  activeFilterCount: number;                             // Numero filtri attivi (per il badge)
  searchbarRef: React.RefObject<HTMLDivElement>;  // Ref per tracciare posizione della searchbar
}

export function HeroSection({
  searchValue,
  onSearchChange,
  onFilterOpen,
  activeFilterCount,
  searchbarRef,
}: HeroSectionProps) {
  /**
   * useRouter — hook di Next.js per la navigazione programmatica
   *
   * Permette di navigare verso altre pagine dall'interno del codice,
   * senza usare un tag <a> o un componente <Link>.
   * router.push() aggiunge la nuova pagina alla cronologia del browser
   * (il tasto "indietro" funziona correttamente).
   */
  const router = useRouter();

  /**
   * handleSearch — gestisce la ricerca e naviga verso /cards
   *
   * encodeURIComponent() converte caratteri speciali nel testo
   * in formato sicuro per un URL. Es: "Lightning Bolt" → "Lightning%20Bolt".
   * Senza questa codifica, gli spazi e altri caratteri romperebbero l'URL.
   *
   * Se il campo è vuoto, naviga comunque su /cards (senza parametro ?q=)
   * mostrando i risultati di default.
   */
  const handleSearch = () => {
    const q = searchValue.trim();
    router.push(q ? `/cards?q=${encodeURIComponent(q)}` : '/cards');
  };

  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        zIndex: 1,            // Sopra il Background fisso (z-index 0)
        minHeight: '100vh',   // Occupa almeno tutta l'altezza dello schermo
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',     // Centra orizzontalmente
        justifyContent: 'center', // Centra verticalmente
        // padding-top = altezza navbar per evitare che la navbar copra il contenuto
        padding: 'var(--navbar-h) 24px 60px',
        textAlign: 'center',
      }}
    >

      {/*
        ── Badge informativo ──
        Piccola pillola con un punto luminoso pulsante e il testo informativo.
        animation: 'fadeUp .8s .1s both' → animazione fadeUp della durata 0.8s,
        con delay di 0.1s. 'both' = applica lo stile iniziale dell'animazione
        anche prima che inizi (evita il flash di contenuto non stilizzato).
      */}
      <div
        className="glass"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 18px 6px 10px', borderRadius: 100, marginBottom: 26,
          fontSize: '.75rem', fontWeight: 500, color: 'var(--gold-light)',
          animation: 'fadeUp .8s .1s both',
        }}
      >
        {/*
          Punto luminoso pulsante: un piccolo cerchio dorato con animazione
          'pulse' (definita in globals.css) che lo fa lampeggiare lentamente.
          box-shadow con il colore del punto crea l'effetto "glow".
        */}
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--gold)', boxShadow: '0 0 8px var(--gold)',
          animation: 'pulse 2s infinite', display: 'block',
        }} />
        Prezzi Cardmarket aggiornati · 32.000+ carte
      </div>

      {/*
        ── Titolo H1 principale ──
        clamp(min, preferred, max) per la dimensione font responsiva:
        - mai meno di 2.8rem
        - idealmente 7% della larghezza viewport (7vw)
        - mai più di 6rem
        Questo lo rende automaticamente più piccolo su schermi mobili.

        La parola "Magic" ha il testo con gradiente:
        background-clip: text + -webkit-text-fill-color: transparent
        è la tecnica standard CSS per applicare un gradiente al testo.
      */}
      <h1
        style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: 'clamp(2.8rem, 7vw, 6rem)',
          fontWeight: 900,
          lineHeight: 1.0,
          marginBottom: 14,
          animation: 'fadeUp .8s .2s both', // Delay 0.2s → appare dopo il badge
        }}
      >
        Il tuo universo
        <br />
        <span
          style={{
            background: 'linear-gradient(135deg, var(--gold-light), var(--gold), #e8a020)',
            WebkitBackgroundClip: 'text',       // Clip del bg alla forma del testo (Chrome/Safari)
            WebkitTextFillColor: 'transparent', // Rende il colore testo trasparente (Safari)
            backgroundClip: 'text',             // Standard (Chrome/Firefox moderni)
          }}
        >
          Magic
        </span>
      </h1>

      {/* ── Sottotitolo ── (delay 0.3s → appare dopo il titolo) */}
      <p
        style={{
          fontSize: '1rem', color: 'var(--text-dim)',
          maxWidth: 450, lineHeight: 1.7,
          margin: '0 auto 36px', fontWeight: 300,
          animation: 'fadeUp .8s .3s both',
        }}
      >
        Cerca carte, costruisci mazzi, monitora i prezzi e connettiti con la community italiana.
      </p>

      {/*
        ── Searchbar principale ──
        ref={searchbarRef} "attacca" il ref React a questo elemento DOM.
        Questo permette alla Navbar di leggere la posizione di questo div
        tramite getBoundingClientRect() nell'event listener dello scroll,
        per sapere quando mostrare la mini-searchbar in alto.
      */}
      <div
        ref={searchbarRef}
        id="hero-searchbar"
        style={{ width: '100%', maxWidth: 640, animation: 'fadeUp .8s .4s both' }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.075)',
            border: '1px solid var(--glass-border)',
            borderRadius: 18, padding: '12px 16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.11)',
            backdropFilter: 'blur(32px)',
          }}
        >
          {/*
            Bottone filtri (icona tre righe):
            - Cambia colore (dorato vs dimmed) in base ai filtri attivi
            - Mostra un badge numerico se activeFilterCount > 0
            - position: relative necessario per posizionare il badge in assoluto
          */}
          <button
            onClick={onFilterOpen}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: activeFilterCount > 0 ? 'var(--gold)' : 'rgba(240,236,224,0.55)',
              position: 'relative', transition: 'all .2s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="9" y1="18" x2="15" y2="18" />
            </svg>
            {/*
              Badge numerico: appare solo se activeFilterCount > 0.
              Posizionato nell'angolo in alto a destra del bottone
              tramite position: absolute + top/right negativi.
            */}
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                background: 'var(--gold)', color: '#1a0f00', borderRadius: 100,
                padding: '1px 5px', fontSize: '.6rem', fontWeight: 700,
                lineHeight: 1.4, border: '1.5px solid var(--bg-deep)',
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/*
            Campo di ricerca principale.
            Controlled component: il valore è sempre quello dello stato searchValue
            del genitore. Ogni modifica aggiorna lo stato tramite onSearchChange,
            che sincronizza anche la mini-searchbar della Navbar.

            onKeyDown: intercetta il tasto Invio per avviare la ricerca
            senza dover cliccare il bottone — UX comune nelle barre di ricerca.
          */}
          <input
            type="text"
            placeholder="Cerca una carta…"
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: '.95rem', fontFamily: 'var(--font-outfit)',
            }}
          />

          {/*
            Bottone "Cerca" → chiama handleSearch che naviga verso /cards?q=...
            flexShrink: 0 → non si restringe mai, mantiene sempre la sua dimensione
          */}
          <button
            onClick={handleSearch}
            style={{
              padding: '9px 18px', borderRadius: 12, fontSize: '.84rem', fontWeight: 600,
              background: 'linear-gradient(135deg, var(--gold), #a07020)', color: '#1a0f00',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-outfit)',
              boxShadow: '0 2px 12px rgba(201,168,76,0.32)', flexShrink: 0,
            }}
          >
            Cerca
          </button>
        </div>
      </div>

      {/*
        ── Indicatore "scorri" ──
        Posizionato in assoluto al fondo della sezione hero.
        La freccia ↓ ha l'animazione 'bounce' (su/giù) per attirare l'attenzione.
        Appare con un delay lungo (1s) per non distrarre dal contenuto principale.
      */}
      <div
        style={{
          position: 'absolute', bottom: 32,
          left: '50%', transform: 'translateX(-50%)', // Centra orizzontalmente
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          color: 'var(--text-dim)', fontSize: '.7rem', letterSpacing: '.1em',
          animation: 'fadeUp 1s 1s both',
        }}
      >
        <span>SCORRI</span>
        <span style={{ animation: 'bounce 2s infinite' }}>↓</span>
      </div>
    </section>
  );
}
